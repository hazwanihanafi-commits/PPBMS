// backend/routes/tasks.js
import express from "express";
import formidable from "formidable";
import fs from "fs";
import { google } from "googleapis";
import sendgrid from "@sendgrid/mail";

import {
  readMasterTracking,
  writeStudentActual,
} from "../services/googleSheets.js";

import auth from "../utils/authMiddleware.js";

console.log("TASKS ROUTER LOADED");

// ======================================================
// SendGrid Init
// ======================================================
let emailEnabled = false;
if (process.env.SENDGRID_API_KEY?.startsWith("SG.")) {
  try {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    emailEnabled = true;
    console.log("SendGrid enabled");
  } catch (e) {
    console.warn("SendGrid init failed:", e.message);
  }
} else {
  console.log("⚠ SendGrid disabled — invalid SENDGRID_API_KEY");
}

const router = express.Router();

// ======================================================
// Helper Functions
// ======================================================
async function findRowNumberByEmail(sheetId, email) {
  const rows = await readMasterTracking(sheetId);

  const index = rows.findIndex(
    (r) =>
      (r["Student's Email"] || "").toLowerCase().trim() ===
      email.toLowerCase().trim()
  );

  return index === -1 ? null : index + 2; // Sheet row
}

function isISO(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// ======================================================
// ROUTE 1 — PDF UPLOAD + update sheet + email supervisor
// ======================================================
router.post("/upload", auth, async (req, res) => {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 40 * 1024 * 1024,
  });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(400).json({ error: "Form parse error" });

      const { studentEmail, activity } = fields;
      const file = files.file;

      if (!studentEmail || !activity)
        return res.status(400).json({ error: "Missing required fields" });

      if (!file)
        return res.status(400).json({ error: "File missing" });

      // Accept PDF by MIME or filename
      const originalName = file.originalFilename || "";
      const isPDF =
        file.mimetype === "application/pdf" ||
        originalName.toLowerCase().endsWith(".pdf");

      if (!isPDF)
        return res.status(400).json({ error: "Only PDF files allowed" });

      // Ensure file path
      const filePath = file.filepath || file.path;
      if (!filePath || !fs.existsSync(filePath))
        return res.status(400).json({ error: "File path error" });

      // Upload to Google Drive
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const authClient = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive.file"],
      });

      const client = await authClient.getClient();
      const drive = google.drive({ version: "v3", auth: client });

      const uploadRes = await drive.files.create({
        requestBody: {
          name: originalName || `upload_${Date.now()}.pdf`,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
        },
        media: { mimeType: "application/pdf", body: fs.createReadStream(filePath) },
        fields: "id",
      });

      const fileId = uploadRes.data.id;
      const fileURL = `https://drive.google.com/file/d/${fileId}/view`;

      await drive.permissions.create({
        fileId,
        requestBody: { role: "reader", type: "anyone" },
      });

      // Update spreadsheet
      const rowNumber = await findRowNumberByEmail(process.env.SHEET_ID, studentEmail);
      if (!rowNumber)
        return res.status(404).json({ error: "Student not found in sheet" });

      const today = new Date().toISOString().slice(0, 10);

      await writeStudentActual(
        process.env.SHEET_ID,
        rowNumber,
        `${activity} - Actual`,
        `${activity} - FileURL`,
        today,
        fileURL
      );

      // Email supervisor (optional)
      if (emailEnabled) {
        try {
          const rows = await readMasterTracking(process.env.SHEET_ID);
          const row = rows[rowNumber - 2];
          const supervisor = row["Main Supervisor's Email"];

          if (supervisor) {
            await sendgrid.send({
              to: supervisor,
              from: process.env.NOTIFY_FROM_EMAIL,
              subject: `PPBMS: ${row["Student Name"]} uploaded ${activity}`,
              text: `${row["Student Name"]} uploaded ${activity}.\nFile: ${fileURL}`,
            });
            console.log("Email sent to supervisor");
          }
        } catch (err) {
          console.warn("Email failed:", err.message);
        }
      }

      return res.json({ ok: true, url: fileURL, date: today });
    } catch (e) {
      console.error("UPLOAD ERROR:", e);
      return res.status(500).json({ error: e.message });
    }
  });
});

// ======================================================
// ROUTE 2 — DATE ONLY UPDATE (NO FILE UPLOAD)
// ======================================================
router.post("/date-only", auth, async (req, res) => {
  try {
    const { studentEmail, activity, date } = req.body;

    if (!studentEmail || !activity || !date)
      return res.status(400).json({ error: "Missing fields" });

    if (!isISO(date))
      return res.status(400).json({ error: "Date must be YYYY-MM-DD" });

    const rowNumber = await findRowNumberByEmail(process.env.SHEET_ID, studentEmail);
    if (!rowNumber)
      return res.status(404).json({ error: "Student not found" });

    await writeStudentActual(
      process.env.SHEET_ID,
      rowNumber,
      `${activity} - Actual`,
      null,   // Do not touch FileURL
      date,
      ""
    );

    return res.json({ ok: true, message: "Date updated", date });
  } catch (e) {
    console.error("DATE-ONLY ERROR:", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
