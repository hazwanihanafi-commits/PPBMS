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
// Helper — Find row number by Student Email
// ======================================================
async function findRowNumberByEmail(sheetId, email) {
  const rows = await readMasterTracking(sheetId);

  const index = rows.findIndex(
    (r) =>
      (r["Student's Email"] || "").toLowerCase().trim() ===
      email.toLowerCase().trim()
  );

  return index === -1 ? null : index + 2; // +2 because header = row 1
}

// ======================================================
// ROUTE: PDF UPLOAD + Google Drive + Sheet Update + Email
// ======================================================
router.post("/upload", auth, async (req, res) => {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 40 * 1024 * 1024,
    allowEmptyFiles: false,
    minFileSize: 1,
    filter: () => true,
  });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        console.error("FORM PARSE ERROR:", err);
        return res.status(400).json({ error: "Form parse error" });
      }

      const studentEmail = fields.studentEmail?.toString().trim();
      const activity = fields.activity?.toString().trim();
      const file = files.file;

      if (!studentEmail || !activity) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!file) {
        return res.status(400).json({ error: "File missing" });
      }

      // ========================
      // Validate PDF
      // ========================
      const originalName = file.originalFilename || "";
      const isPDF =
        file.mimetype === "application/pdf" ||
        originalName.toLowerCase().endsWith(".pdf");

      if (!isPDF) {
        return res.status(400).json({ error: "Only PDF files allowed" });
      }

      const filePath = file.filepath;
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(400).json({ error: "File path error" });
      }

      // ========================
      // UPLOAD TO GOOGLE DRIVE
      // ========================
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const authClient = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          "https://www.googleapis.com/auth/drive",
          "https://www.googleapis.com/auth/drive.file",
        ],
      });

      const client = await authClient.getClient();
      const drive = google.drive({ version: "v3", auth: client });

      const uploadRes = await drive.files.create({
        requestBody: {
          name: originalName || `upload_${Date.now()}.pdf`,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
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

      // ========================
      // UPDATE GOOGLE SHEET
      // ========================
      const rowNumber = await findRowNumberByEmail(
        process.env.SHEET_ID,
        studentEmail
      );

      if (!rowNumber) {
        return res.status(404).json({ error: "Student not found in sheet" });
      }

      const today = new Date().toISOString().slice(0, 10);

      await writeStudentActual(
        process.env.SHEET_ID,
        rowNumber,
        `${activity} - Actual`,
        `${activity} - FileURL`,
        today,
        fileURL
      );

      // ========================
      // EMAIL SUPERVISOR
      // ========================
      if (emailEnabled) {
        try {
          const rows = await readMasterTracking(process.env.SHEET_ID);
          const row = rows[rowNumber - 2];
          const supervisorEmail = row["Main Supervisor's Email"];
          const studentName = row["Student Name"];

          if (supervisorEmail) {
            await sendgrid.send({
              to: supervisorEmail,
              from: process.env.NOTIFY_FROM_EMAIL,
              subject: `PPBMS: ${studentName} uploaded ${activity}`,
              text: `${studentName} uploaded ${activity}. File: ${fileURL}`,
            });
          }
        } catch (e) {
          console.warn("Email failed:", e.message);
        }
      }

      // SUCCESS RESPONSE
      return res.json({
        ok: true,
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
