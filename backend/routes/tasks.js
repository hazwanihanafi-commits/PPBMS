// backend/routes/tasks.js
import express from "express";
import formidable from "formidable";
import fs from "fs";
import { google } from "googleapis";
import sendgrid from "@sendgrid/mail";
import { readMasterTracking, writeStudentActual } from "../services/googleSheets.js";
import auth from "../utils/authMiddleware.js";

const router = express.Router();
sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

// Find sheet row by student email
async function findRowNumberByEmail(sheetId, studentEmail) {
  const rows = await readMasterTracking(sheetId);
  const idx = rows.findIndex(
    r =>
      (r["Student's Email"] || "")
        .toLowerCase()
        .trim() === (studentEmail || "").toLowerCase().trim()
  );
  if (idx === -1) return null;
  return idx + 2; // +2 because row 1 is header
}

router.post("/upload", auth, async (req, res) => {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(400).json({ error: "Invalid form data" });

      const { studentEmail, activity } = fields;
      const file = files.file;

      if (!studentEmail || !activity) {
        return res.status(400).json({ error: "Missing studentEmail or activity" });
      }
      if (!file) {
        return res.status(400).json({ error: "File not found" });
      }

      // ---- FIX FOR SAFARI / MOBILE / FORMIDABLE v3 ----
      const filePath =
        file.filepath ||
        file._writeStream?.path ||
        file._writeStream?.filepath;

      if (!filePath) {
        console.error("UPLOAD ERROR — file path missing:", file);
        return res.status(400).json({
          error: "File path missing (mobile browser issue). Try another browser."
        });
      }

      // ---- Google Drive Upload ----
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

      const authClient = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          "https://www.googleapis.com/auth/drive.file",
          "https://www.googleapis.com/auth/drive"
        ]
      });

      const client = await authClient.getClient();
      const drive = google.drive({ version: "v3", auth: client });

      const driveRes = await drive.files.create({
        requestBody: {
          name: file.originalFilename || `upload_${Date.now()}`,
          parents: process.env.GOOGLE_DRIVE_FOLDER_ID
            ? [process.env.GOOGLE_DRIVE_FOLDER_ID]
            : undefined
        },
        media: {
          mimeType: file.mimetype,
          body: fs.createReadStream(filePath) // SAFE for all devices
        },
        fields: "id"
      });

      const fileId = driveRes.data.id;

      // Make file public
      try {
        await drive.permissions.create({
          fileId,
          requestBody: { role: "reader", type: "anyone" }
        });
      } catch (e) {
        console.warn("Permission error:", e.message);
      }

      const fileURL = `https://drive.google.com/file/d/${fileId}/view`;

      // ---- Update Google Sheet ----
      const rowNumber = await findRowNumberByEmail(
        process.env.SHEET_ID,
        studentEmail
      );

      if (!rowNumber) {
        return res.status(404).json({ error: "Student not found in sheet" });
      }

      const actualColumn = `${activity} - Actual`;
      const urlColumn = `${activity} - FileURL`;
      const today = new Date().toISOString().slice(0, 10);

      await writeStudentActual(
        process.env.SHEET_ID,
        rowNumber,
        actualColumn,
        urlColumn,
        today,
        fileURL
      );

      // ---- Email supervisor notification ----
      try {
        const rows = await readMasterTracking(process.env.SHEET_ID);
        const row = rows[rowNumber - 2];
        const supervisorEmail =
          row["Main Supervisor's Email"] || row["Main Supervisor"];

        if (supervisorEmail && process.env.SENDGRID_API_KEY) {
          await sendgrid.send({
            to: supervisorEmail,
            from: process.env.NOTIFY_FROM_EMAIL,
            subject: `PPBMS: ${row["Student Name"]} uploaded ${activity}`,
            text: `${row["Student Name"]} uploaded "${activity}". Please review.`
          });
        }
      } catch (e) {
        console.warn("Email notify error:", e?.message || e);
      }

      return res.json({ ok: true, url: fileURL });
    } catch (e) {
      console.error("UPLOAD ERROR:", e);
      return res.status(500).json({ error: e.message });
    }
  });
});

export default router;
