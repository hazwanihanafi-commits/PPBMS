// backend/routes/tasks.js

import express from "express";
import formidable from "formidable";
import fs from "fs";
import { google } from "googleapis";
import sendgrid from "@sendgrid/mail";

import {
  readMasterTracking,
  writeStudentActual
} from "../services/googleSheets.js";

import auth from "../utils/authMiddleware.js";

const router = express.Router();

/* -----------------------------------------------
   EMAIL INIT
-------------------------------------------------*/
let emailEnabled = false;
if (process.env.SENDGRID_API_KEY?.startsWith("SG.")) {
  try {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    emailEnabled = true;
  } catch {}
}

/* -----------------------------------------------
   Helper: find student row
-------------------------------------------------*/
async function findRowNumberByEmail(sheetId, email) {
  const rows = await readMasterTracking(sheetId);
  const idx = rows.findIndex(
    (r) =>
      (r["Student's Email"] || "").toLowerCase().trim() ===
      email.toLowerCase().trim()
  );
  return idx === -1 ? null : idx + 2;
}

/* -----------------------------------------------
   UPLOAD ROUTE
-------------------------------------------------*/
router.post("/upload", auth, async (req, res) => {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024,
    allowEmptyFiles: false,
    minFileSize: 1
  });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(400).json({ error: "Form parse error" });

      const studentEmail = fields.studentEmail?.toString().trim();
      const activity = fields.activity?.toString().trim();
      const file = files.file;

      if (!studentEmail || !activity)
        return res.status(400).json({ error: "Missing required fields" });

      if (!file) return res.status(400).json({ error: "File missing" });

      /* --------------------------------------
         PDF VALIDATION
      -----------------------------------------*/
      const name = file.originalFilename || file.newFilename || "";
      const mime = file.mimetype || "";

      const isPDF =
        mime.includes("pdf") || name.toLowerCase().endsWith(".pdf");

      if (!isPDF)
        return res.status(400).json({ error: "Only PDF files allowed" });

      let filePath = file.filepath || file.path;

      // Backup: if no path, extract buffer
      if (!filePath && file.toBuffer) {
        const buf = await file.toBuffer();
        filePath = `/tmp/upload_${Date.now()}.pdf`;
        await fs.promises.writeFile(filePath, buf);
      }

      if (!filePath) {
        return res.status(400).json({
          error: "Failed to access uploaded PDF (file path missing)"
        });
      }

      /* --------------------------------------
         GOOGLE DRIVE UPLOAD
      -----------------------------------------*/
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

      const authClient = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          "https://www.googleapis.com/auth/drive",
          "https://www.googleapis.com/auth/drive.file"
        ]
      });

      const client = await authClient.getClient();
      const drive = google.drive({ version: "v3", auth: client });

      const upload = await drive.files.create({
        requestBody: {
          name: name || `upload_${Date.now()}.pdf`,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
        },
        media: {
          mimeType: "application/pdf",
          body: fs.createReadStream(filePath)
        },
        fields: "id"
      });

      const fileId = upload.data.id;
      const fileURL = `https://drive.google.com/file/d/${fileId}/view`;

      // Make file public
      try {
        await drive.permissions.create({
          fileId,
          requestBody: { role: "reader", type: "anyone" }
        });
      } catch (e) {}

      /* --------------------------------------
         UPDATE GOOGLE SHEET
      -----------------------------------------*/
      const rowNumber = await findRowNumberByEmail(
        process.env.SHEET_ID,
        studentEmail
      );

      if (!rowNumber)
        return res.status(404).json({ error: "Student not found" });

      const today = new Date().toISOString().slice(0, 10);

      await writeStudentActual(
        process.env.SHEET_ID,
        rowNumber,
        `${activity} - Actual`,
        `${activity} - FileURL`,
        today,
        fileURL
      );

      /* --------------------------------------
         EMAIL SUPERVISOR
      -----------------------------------------*/
      if (emailEnabled) {
        try {
          const rows = await readMasterTracking(process.env.SHEET_ID);
          const row = rows[rowNumber - 2];

          const supervisor = row["Main Supervisor's Email"];
          const studentName = row["Student Name"];

          if (supervisor) {
            await sendgrid.send({
              to: supervisor,
              from: process.env.NOTIFY_FROM_EMAIL,
              subject: `PPBMS: ${studentName} uploaded ${activity}`,
              text: `${studentName} uploaded ${activity}. File: ${fileURL}`
            });
          }
        } catch {}
      }

      return res.json({
        ok: true,
        url: fileURL,
        date: today
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
});

export default router;
