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

const router = express.Router();
sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

// ----------------------------------------------
// Utility: Find the correct row for the student
// ----------------------------------------------
async function findRowNumberByEmail(sheetId, studentEmail) {
  const rows = await readMasterTracking(sheetId);

  const index = rows.findIndex(
    (r) =>
      (r["Student's Email"] || "").toLowerCase().trim() ===
      (studentEmail || "").toLowerCase().trim()
  );

  if (index === -1) return null;

  return index + 2; // row 2 = first student row
}

// ----------------------------------------------
// PDF UPLOAD ROUTE
// ----------------------------------------------
router.post("/upload", auth, async (req, res) => {
  // Formidable handles file uploads safely (Safari/iPhone supported)
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 30 * 1024 * 1024, // 30 MB
  });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        console.error("FORM PARSE ERROR", err);
        return res.status(400).json({ error: "Invalid form data" });
      }

      const { studentEmail, activity } = fields;
      const file = files.file;

      if (!studentEmail || !activity) {
        return res.status(400).json({
          error: "Missing studentEmail or activity",
        });
      }

      if (!file) {
        return res.status(400).json({ error: "File not found" });
      }

      // -------------------------------------------------------
      // PDF RESTRICTION
      // -------------------------------------------------------
      if (file.mimetype !== "application/pdf") {
        return res
          .status(400)
          .json({ error: "Only PDF files are allowed." });
      }

      // -------------------------------------------------------
      // SAFARI / iOS FIX — Formidable v3 uses file.filepath
      // -------------------------------------------------------
      const filePath = file.filepath;

      // -------------------------------------------------------
      // GOOGLE DRIVE UPLOAD
      // -------------------------------------------------------
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

      const authClient = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          "https://www.googleapis.com/auth/drive.file",
          "https://www.googleapis.com/auth/drive",
        ],
      });

      const client = await authClient.getClient();
      const drive = google.drive({ version: "v3", auth: client });

      const uploadRes = await drive.files.create({
        requestBody: {
          name: file.originalFilename || `upload_${Date.now()}.pdf`,
          parents: process.env.GOOGLE_DRIVE_FOLDER_ID
            ? [process.env.GOOGLE_DRIVE_FOLDER_ID]
            : undefined,
        },
        media: {
          mimeType: "application/pdf",
          body: fs.createReadStream(filePath),
        },
        fields: "id",
      });

      const fileId = uploadRes.data.id;
      const fileURL = `https://drive.google.com/file/d/${fileId}/view`;

      // Make file public
      try {
        await drive.permissions.create({
          fileId,
          requestBody: { role: "reader", type: "anyone" },
        });
      } catch (e) {
        console.warn("Drive permission warning:", e.message);
      }

      // -------------------------------------------------------
      // FIND SHEET ROW
      // -------------------------------------------------------
      const rowNumber = await findRowNumberByEmail(
        process.env.SHEET_ID,
        studentEmail
      );

      if (!rowNumber) {
        return res.status(404).json({
          error: "Student email not found in MasterTracking sheet",
        });
      }

      // -------------------------------------------------------
      // UPDATE GOOGLE SHEETS (Actual date + FileURL)
      // -------------------------------------------------------
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

      // -------------------------------------------------------
      // SEND SUPERVISOR EMAIL
      // -------------------------------------------------------
      try {
        const rows = await readMasterTracking(process.env.SHEET_ID);
        const studentRow = rows[rowNumber - 2];
        const supervisorEmail =
          studentRow["Main Supervisor's Email"] ||
          studentRow["Main Supervisor"];

        if (supervisorEmail && process.env.SENDGRID_API_KEY) {
          await sendgrid.send({
            to: supervisorEmail,
            from: process.env.NOTIFY_FROM_EMAIL,
            subject: `PPBMS: ${studentRow["Student Name"]} uploaded ${activity}`,
            text: `${studentRow["Student Name"]} uploaded "${activity}". Please review.`,
          });
        }
      } catch (emailError) {
        console.warn("Email notification failed:", emailError?.message);
      }

      // -------------------------------------------------------
      // RESPONSE
      // -------------------------------------------------------
      return res.json({
        ok: true,
        message: "Upload successful. Sheet updated.",
        url: fileURL,
        date: today,
      });
    } catch (e) {
      console.error("UPLOAD ERROR:", e);
      return res.status(500).json({ error: e.message });
    }
  });
});

export default router;
