// backend/routes/tasks.js
import express from "express";
import formidable from "formidable";
import fs from "fs";
import { google } from "googleapis";
import sendgrid from "@sendgrid/mail";

import {
  readMasterTracking,
  writeToSheet
} from "../services/googleSheets.js";

import { getCachedSheet, clearCache } from "../utils/sheetCache.js";
import auth from "../utils/authMiddleware.js";

const router = express.Router();
sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

const SHEET_ID = process.env.SHEET_ID;
const SHEET_NAME = "MasterTracking";

/* --------------------------------------------
   ACTIVITIES (matching your sheet)
-------------------------------------------- */
const ACTIVITIES = [
  "Development Plan & Learning Contract",
  "Proposal Defense Endorsed",
  "Pilot / Phase 1 Completed",
  "Phase 2 Data Collection Begun",
  "Annual Progress Review (Year 1)",
  "Phase 2 Data Collection Continued",
  "Seminar Completed",
  "Annual Progress Review (Year 2)",
  "Thesis Draft Completed",
  "Final Progress Review (Year 3)",
  "Viva Voce",
  "Corrections Completed",
  "Final Thesis Submission"
];

/* --------------------------------------------
   Evidence required for these activities
-------------------------------------------- */
const EVIDENCE_REQUIRED = new Set([
  "Development Plan & Learning Contract",
  "Annual Progress Review (Year 1)",
  "Annual Progress Review (Year 2)",
  "Final Progress Review (Year 3)"
]);

/* --------------------------------------------
   Helpers
-------------------------------------------- */
async function findRowNumberByEmail(email) {
  const rows = await getCachedSheet(SHEET_ID);
  const idx = rows.findIndex(
    (r) =>
      (r["Student's Email"] || "").toLowerCase().trim() ===
      (email || "").toLowerCase().trim()
  );
  if (idx === -1) return null;
  return idx + 2;
}

async function updateSheetCell(rowNumber, columnName, value) {
  await writeToSheet(SHEET_ID, SHEET_NAME, rowNumber, columnName, value);
  clearCache();
}

/* --------------------------------------------
   POST /api/tasks/toggle
-------------------------------------------- */
// --- inside backend/routes/tasks.js (replace existing /toggle handler) ---
router.post("/toggle", auth, async (req, res) => {
  try {
    const { studentEmail, key, actor, value } = req.body;
    if (!studentEmail || !key || !actor) return res.status(400).json({ error: "Missing fields" });

    const rowNumber = await findRowNumberByEmail(studentEmail);
    if (!rowNumber) return res.status(404).json({ error: "Student not found" });

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    if (actor === "student") {
      // value should be boolean true/false
      const willBeTrue = value === true || value === "true" || value === "TRUE";

      // Update main tick column (set TRUE or FALSE)
      await updateSheetCell(rowNumber, key, willBeTrue ? "TRUE" : "FALSE");

      // Also update Submitted column for consistency
      await updateSheetCell(rowNumber, `${key} Submitted`, willBeTrue ? "TRUE" : "FALSE");

      if (willBeTrue) {
        // set the StudentTickDate and reset supervisor approval
        await updateSheetCell(rowNumber, `${key} StudentTickDate`, today);
        await updateSheetCell(rowNumber, `${key} SupervisorApproved`, "FALSE");
        await updateSheetCell(rowNumber, `${key} SupervisorApproveDate`, "");
      } else {
        // unticked: clear date and supervisor approval
        await updateSheetCell(rowNumber, `${key} StudentTickDate`, "");
        await updateSheetCell(rowNumber, `${key} SupervisorApproved`, "FALSE");
        await updateSheetCell(rowNumber, `${key} SupervisorApproveDate`, "");
      }

      // Try to notify supervisor asynchronously (don't block on errors)
      try {
        const rows = await getCachedSheet(SHEET_ID);
        const rowData = rows[rowNumber - 2];
        const supervisorEmail = rowData["Main Supervisor's Email"] || rowData["Main Supervisor"];
        if (supervisorEmail && willBeTrue) {
          await sendgrid.send({
            to: supervisorEmail,
            from: process.env.NOTIFY_FROM_EMAIL,
            subject: `PPBMS: ${rowData["Student Name"]} ticked "${key}"`,
            text: `${rowData["Student Name"]} ticked "${key}". Please review and approve in the Supervisor dashboard.`,
          });
        }
      } catch (e) {
        console.warn("notify error:", e?.message || e);
      }

      return res.json({ ok: true, value: willBeTrue });
    }

    if (actor === "supervisor") {
      // Only allow supervisor role — auth middleware should check role
      const willBeTrue = value === true || value === "true" || value === "TRUE";
      await updateSheetCell(rowNumber, `${key} SupervisorApproved`, willBeTrue ? "TRUE" : "FALSE");
      await updateSheetCell(rowNumber, `${key} SupervisorApproveDate`, willBeTrue ? today : "");

      // notify student if approved
      try {
        const rows = await getCachedSheet(SHEET_ID);
        const rowData = rows[rowNumber - 2];
        const studentEmailRow = rowData["Student's Email"];
        if (studentEmailRow && willBeTrue) {
          await sendgrid.send({
            to: studentEmailRow,
            from: process.env.NOTIFY_FROM_EMAIL,
            subject: `PPBMS: Supervisor approved "${key}"`,
            text: `Your supervisor approved "${key}". Check your dashboard for details.`,
          });
        }
      } catch (e) {
        console.warn("notify error:", e?.message || e);
      }

      return res.json({ ok: true, value: willBeTrue });
    }

    return res.status(400).json({ error: "actor must be 'student' or 'supervisor'" });
  } catch (err) {
    console.error("toggle error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* --------------------------------------------
   POST /api/tasks/upload
-------------------------------------------- */
router.post("/upload", auth, async (req, res) => {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: "Invalid form data" });

    try {
      const { studentEmail, key } = fields;
      const file = files.file;

      if (!file) return res.status(400).json({ error: "File missing" });

      const rowNumber = await findRowNumberByEmail(studentEmail);
      if (!rowNumber)
        return res.status(404).json({ error: "Student not found" });

      const credentials = JSON.parse(
        process.env.GOOGLE_SERVICE_ACCOUNT_JSON
      );

      const authClient = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive.file"],
      });

      const client = await authClient.getClient();
      const drive = google.drive({ version: "v3", auth: client });

      const stream = fs.createReadStream(file.filepath || file.path);

      const uploaded = await drive.files.create({
        requestBody: {
          name:
            file.originalFilename ||
            file.newFilename ||
            `upload_${Date.now()}`,
          parents: [
            process.env.GOOGLE_DRIVE_FOLDER_ID || undefined,
          ],
        },
        media: { mimeType: file.mimetype, body: stream },
        fields: "id",
      });

      const fileId = uploaded.data.id;
      const publicURL = `https://drive.google.com/file/d/${fileId}/view`;

      const today = new Date().toISOString().slice(0, 10);

      await updateSheetCell(rowNumber, `${key} Submitted`, "TRUE");
      await updateSheetCell(rowNumber, `${key} Submission URL`, publicURL);
      await updateSheetCell(rowNumber, `${key} StudentTickDate`, today);
      await updateSheetCell(rowNumber, `${key} SupervisorApproved`, "FALSE");

      return res.json({ ok: true, url: publicURL });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
});

/* --------------------------------------------
   Export
-------------------------------------------- */
export default router;
