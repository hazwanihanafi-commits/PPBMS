// backend/routes/tasks.js
import express from "express";
import formidable from "formidable";
import fs from "fs";
import { google } from "googleapis";
import sendgrid from "@sendgrid/mail";
import { readMasterTracking, writeToSheet, ensureHeaders, readHeaderRow } from "../services/googleSheets.js";
import auth from "../utils/authMiddleware.js";

const router = express.Router();
sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

const SHEET_ID = process.env.SHEET_ID;
const SHEET_NAME = "MasterTracking";

// activities list (must match sheet)
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

// which activities require a file upload (evidence)
const EVIDENCE_REQUIRED = new Set([
  "Development Plan & Learning Contract",
  "Annual Progress Review (Year 1)",
  "Annual Progress Review (Year 2)",
  "Final Progress Review (Year 3)"
]);

// helper to build all required header variants for the activities
function buildRequiredHeaders() {
  const base = [
    "Matric","Student Name","Programme","Start Date","Field","Department","Main Supervisor","Co-Supervisor(s)","Main Supervisor's Email","Student's Email",
    // P1..P5 columns assumed already present - but including them if missing is safe
    "P1 Submitted","P1 StudentTickDate","P1 Submission URL","P1 SupervisorApproved","P1 SupervisorApproveDate",
    "P3 Submitted","P3 StudentTickDate","P3 Submission URL","P3 SupervisorApproved","P3 SupervisorApproveDate",
    "P4 Submitted","P4 StudentTickDate","P4 Submission URL","P4 SupervisorApproved","P4 SupervisorApproveDate",
    "P5 Submitted","P5 StudentTickDate","P5 Submission URL","P5 SupervisorApproved","P5 SupervisorApproveDate",
  ];
  const activityCols = [];
  ACTIVITIES.forEach(k => {
    activityCols.push(k);
    activityCols.push(`${k} Submitted`);
    activityCols.push(`${k} StudentTickDate`);
    activityCols.push(`${k} Submission URL`);
    activityCols.push(`${k} SupervisorApproved`);
    activityCols.push(`${k} SupervisorApproveDate`);
  });
  return base.concat(activityCols).concat(["Status P","Notes","Last Updated"]);
}

// ensure headers exist on startup
(async () => {
  try {
    const headers = buildRequiredHeaders();
    const result = await ensureHeaders(SHEET_ID, headers);
    if (result.updated) {
      console.log("Added missing headers:", result.missing);
    } else {
      console.log("Headers already present.");
    }
  } catch (e) {
    console.warn("ensureHeaders failed:", e.message || e);
  }
})();

// helper: find the row number (1-indexed) for a student email
async function findRowNumberByEmail(email) {
  const rows = await readMasterTracking(SHEET_ID);
  const idx = rows.findIndex(r => (r["Student's Email"] || "").toLowerCase().trim() === (email || "").toLowerCase().trim());
  if (idx === -1) return null;
  return idx + 2;
}

// update a cell (wrapper)
async function updateSheetCell(rowNumber, columnName, value) {
  return await writeToSheet(SHEET_ID, SHEET_NAME, rowNumber, columnName, value);
}

/*
POST /api/tasks/toggle
body: { studentEmail, key, actor }
actor: 'student' or 'supervisor'
*/
router.post("/toggle", auth, async (req, res) => {
  try {
    const { studentEmail, key, actor } = req.body;
    if (!studentEmail || !key || !actor) return res.status(400).json({ error: "Missing fields" });
    if (!ACTIVITIES.includes(key)) return res.status(400).json({ error: "Unknown activity key" });

    const rowNumber = await findRowNumberByEmail(studentEmail);
    if (!rowNumber) return res.status(404).json({ error: "Student not found" });

    const today = new Date().toISOString().slice(0,10);

    if (actor === "student") {
      // mark as ticked
      await updateSheetCell(rowNumber, key, "TRUE");
      await updateSheetCell(rowNumber, `${key} StudentTickDate`, today);

      // if there's a required evidence and not yet uploaded, do NOT auto-mark Submitted; the frontend will upload file
      // clear supervisor approval to require endorsement
      await updateSheetCell(rowNumber, `${key} SupervisorApproved`, "FALSE");
      await updateSheetCell(rowNumber, `${key} SupervisorApproveDate`, "");

      // Notify supervisor (best-effort)
      try {
        const rows = await readMasterTracking(SHEET_ID);
        const rowData = rows[rowNumber - 2];
        const supervisorEmail = rowData["Main Supervisor's Email"] || rowData["Main Supervisor"];
        if (supervisorEmail) {
          await sendgrid.send({
            to: supervisorEmail,
            from: process.env.NOTIFY_FROM_EMAIL,
            subject: `PPBMS: ${rowData["Student Name"]} ticked "${key}"`,
            text: `${rowData["Student Name"]} ticked "${key}". Please review in the Supervisor dashboard.`
          });
        }
      } catch (e) {
        console.warn("notify error:", e?.message || e);
      }

      return res.json({ ok: true, message: "Student tick recorded" });

    } else if (actor === "supervisor") {
      // check supervisor role
      if (!req.user || (req.user.role && req.user.role !== 'supervisor' && req.user.role !== 'admin')) {
        // allow admin too
        // if your auth middleware doesn't include role, adapt as needed
      }
      await updateSheetCell(rowNumber, `${key} SupervisorApproved`, "TRUE");
      await updateSheetCell(rowNumber, `${key} SupervisorApproveDate`, today);

      // notify student
      try {
        const rows = await readMasterTracking(SHEET_ID);
        const rowData = rows[rowNumber - 2];
        const studentEmailRow = rowData["Student's Email"];
        if (studentEmailRow) {
          await sendgrid.send({
            to: studentEmailRow,
            from: process.env.NOTIFY_FROM_EMAIL,
            subject: `PPBMS: Supervisor approved "${key}"`,
            text: `Your supervisor approved "${key}". Check your dashboard for details.`
          });
        }
      } catch (e) {
        console.warn("notify error:", e?.message || e);
      }

      return res.json({ ok: true, message: "Supervisor approval recorded" });
    } else {
      return res.status(400).json({ error: "actor must be 'student' or 'supervisor'" });
    }
  } catch (err) {
    console.error("toggle error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/*
POST /api/tasks/upload
multipart/form-data: file, studentEmail, key
*/
router.post("/upload", auth, async (req, res) => {
  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(400).json({ error: "invalid form" });
      const { studentEmail, key } = fields;
      if (!studentEmail || !key) return res.status(400).json({ error: "Missing studentEmail or key" });
      if (!ACTIVITIES.includes(key)) return res.status(400).json({ error: "Unknown activity key" });

      const file = files.file;
      if (!file) return res.status(400).json({ error: "Missing file" });

      // Upload to Google Drive
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const authClient = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"]
      });
      const client = await authClient.getClient();
      const drive = google.drive({ version: "v3", auth: client });

      const fileStream = fs.createReadStream(file.filepath || file.path);

      const driveRes = await drive.files.create({
        requestBody: {
          name: file.originalFilename || file.newFilename || `upload_${Date.now()}`,
          parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : undefined
        },
        media: {
          mimeType: file.mimetype,
          body: fileStream
        },
        fields: "id, webViewLink, webContentLink"
      });

      const fileId = driveRes.data.id;
      // make file readable publicly
      try {
        await drive.permissions.create({
          fileId,
          requestBody: { role: "reader", type: "anyone" }
        });
      } catch (e) {
        console.warn("permission set failed:", e?.message || e);
      }

      const url = `https://drive.google.com/file/d/${fileId}/view`;

      const rowNumber = await findRowNumberByEmail(studentEmail);
      if (!rowNumber) return res.status(404).json({ error: "Student not found" });

      // write into the activity-specific columns
      await updateSheetCell(rowNumber, `${key} Submitted`, "TRUE");
      await updateSheetCell(rowNumber, `${key} Submission URL`, url);
      const today = new Date().toISOString().slice(0,10);
      await updateSheetCell(rowNumber, `${key} StudentTickDate`, today);
      await updateSheetCell(rowNumber, `${key} SupervisorApproved`, "FALSE");

      return res.json({ ok: true, url });
    } catch (e) {
      console.error("upload error:", e);
      return res.status(500).json({ error: e.message });
    }
  });
});

export default router;
