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
  // ---- Safari, Mobile and Node-safe upload ----
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 30 * 1024 * 1024, // 30MB
  });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(400).json({ error: "Invalid form data" });

      const { studentEmail, activity } = fields;
      const file = files.file;

      if (!studentEmail || !activity) {
        return res.status(400).json({
          error: "Missing studentEmail or activity"
        });
      }
      if (!file) {
        return res.status(400).json({ error: "File not found" });
      }

      // ---- PDF ONLY ENFORCEMENT ----
      if (file.mimetype !== "application/pdf") {
        return res.status(400).json({ error: "Only PDF files are allowed" });
      }

      // ---- IMPORTANT: SAFARI FIX ----
      // Formidable v3 ALWAYS provides file.filepath correctly
      const filePath = file.filepath;

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
          body: fs.createReadStream(filePath)
        },
        fields: "id"
      });

      const fileId = driveRes.data.id;

      // Make public
      try {
        await drive.permissions.create({
          fileId,
          requestBody: { role: "reader", type: "anyone" }
        });
      } catch (e) {
        console.warn("Permission error:", e.message);
      }

      const fileURL = `https://drive.google.com/file/d/${fileId}/view`;

      // ---- Find Student Row ----
      const rowNumber = await findRowNumberByEmail(
        process.env.SHEET_ID,
        studentEmail
      );

      if (!rowNumber) {
        return res.status(404).json({ error: "Student not found in sheet" });
      }

      // Column names that match your Google Sheet headers
      const actualColumn = `${activity} - Actual`;
      const urlColumn = `${activity} - FileURL`;
      const today = new Date().toISOString().slice(0, 10);

      // ---- Write both DATE + URL ----
      await writeStudentActual(
        process.env.SHEET_ID,
        rowNumber,
        actualColumn,
        urlColumn,
        today,
        fileURL
      );

      // ---- Email Supervisor ----
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

      return res.json({
        ok: true,
        message: "Uploaded successfully",
        url: fileURL,
        date: today
      });
    } catch (e) {
      console.error("UPLOAD ERROR:", e);
      return res.status(500).json({ error: e.message });
    }
  });
});

export default router;
