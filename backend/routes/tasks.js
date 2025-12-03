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

// -------------------------
// SendGrid initialization
// -------------------------
let emailEnabled = false;
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith("SG.")) {
  try {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    emailEnabled = true;
    console.log("SendGrid enabled");
  } catch (e) {
    console.warn("SendGrid initialization failed:", e?.message || e);
  }
} else {
  console.log("⚠ SendGrid disabled — missing or invalid SENDGRID_API_KEY");
}

const router = express.Router();

// -------------------------
// Helpers
// -------------------------
async function findRowNumberByEmail(sheetId, studentEmail) {
  const rows = await readMasterTracking(sheetId);
  const index = rows.findIndex(
    (r) =>
      (r["Student's Email"] || "").toLowerCase().trim() ===
      (studentEmail || "").toLowerCase().trim()
  );
  if (index === -1) return null;
  return index + 2; // sheet row number
}

function isValidISODateString(s) {
  // Accept YYYY-MM-DD (basic check)
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// -------------------------
// Upload route (PDF + optional chosen date from client)
// POST /tasks/upload
// fields: studentEmail, activity, optionally chosenDate
// file: file
// -------------------------
router.post("/upload", auth, async (req, res) => {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 40 * 1024 * 1024, // 40 MB
  });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        console.error("FORM PARSE ERROR:", err);
        return res.status(400).json({ error: "Invalid form data" });
      }

      const { studentEmail, activity, chosenDate } = fields;
      const file = files?.file;

      if (!studentEmail || !activity) {
        return res.status(400).json({ error: "Missing studentEmail or activity" });
      }

      if (!file) {
        return res.status(400).json({ error: "File not found" });
      }

      // Accept PDF if mimetype is application/pdf OR filename ends with .pdf
      const originalFilename = (file.originalFilename || file.name || "").toString();
      const mimetype = file.mimetype || file.type || "";

      const isPdfByMime = mimetype === "application/pdf";
      const isPdfByName = originalFilename.toLowerCase().endsWith(".pdf");
      const isPDF = isPdfByMime || isPdfByName;

      if (!isPDF) {
        return res.status(400).json({ error: "Only PDF files are allowed." });
      }

      // file path (formidable v3)
      const filePath = file.filepath || file.path || file._writeStream?.path;
      if (!filePath || !fs.existsSync(filePath)) {
        console.error("UPLOAD ERROR — file path missing or unreadable", file);
        return res.status(400).json({ error: "File path missing (mobile browser issue)." });
      }

      // Upload to Google Drive
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
      const authClient = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"],
      });
      const client = await authClient.getClient();
      const drive = google.drive({ version: "v3", auth: client });

      const uploadRes = await drive.files.create({
        requestBody: {
          name: originalFilename || `upload_${Date.now()}.pdf`,
          parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : undefined,
        },
        media: {
          mimeType: "application/pdf",
          body: fs.createReadStream(filePath),
        },
        fields: "id",
      });

      const fileId = uploadRes.data.id;
      const fileURL = `https://drive.google.com/file/d/${fileId}/view`;

      // Try to make public (best-effort)
      try {
        await drive.permissions.create({
          fileId,
          requestBody: { role: "reader", type: "anyone" },
        });
      } catch (e) {
        console.warn("Drive permission warning:", e?.message || e);
      }

      // Determine row and update sheet
      const rowNumber = await findRowNumberByEmail(process.env.SHEET_ID, studentEmail);
      if (!rowNumber) {
        return res.status(404).json({ error: "Student email not found in sheet" });
      }

      // If client provided chosenDate and it's valid, use it; otherwise use today
      const todayIso = new Date().toISOString().slice(0, 10);
      const actualDate = isValidISODateString(chosenDate) ? chosenDate : todayIso;

      const actualColumn = `${activity} - Actual`;
      const urlColumn = `${activity} - FileURL`;

      await writeStudentActual(process.env.SHEET_ID, rowNumber, actualColumn, urlColumn, actualDate, fileURL);

      // Send email to supervisor if enabled
      if (emailEnabled) {
        try {
          const rows = await readMasterTracking(process.env.SHEET_ID);
          const studentRow = rows[rowNumber - 2];
          const supervisorEmail = studentRow["Main Supervisor's Email"] || studentRow["Main Supervisor"];

          if (supervisorEmail) {
            await sendgrid.send({
              to: supervisorEmail,
              from: process.env.NOTIFY_FROM_EMAIL,
              subject: `PPBMS: ${studentRow["Student Name"]} uploaded ${activity}`,
              text: `${studentRow["Student Name"]} uploaded "${activity}" on ${actualDate}.\n\nFile: ${fileURL}`,
            });
            console.log("Email sent to", supervisorEmail);
          }
        } catch (emailErr) {
          console.warn("Email send failed:", emailErr?.message || emailErr);
        }
      }

      return res.json({ ok: true, url: fileURL, date: actualDate, message: "Upload successful. Sheet updated." });
    } catch (e) {
      console.error("UPLOAD ERROR:", e);
      return res.status(500).json({ error: e?.message || "Server error" });
    }
  });
});

// -------------------------
// Date-only route (no file)
// POST /tasks/date-only
// body: { studentEmail, activity, date }  (date in YYYY-MM-DD)
// -------------------------
router.post("/date-only", auth, async (req, res) => {
  try {
    const { studentEmail, activity, date } = req.body;

    if (!studentEmail || !activity || !date) {
      return res.status(400).json({ error: "Missing studentEmail, activity, or date" });
    }
    if (!isValidISODateString(date)) {
      return res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
    }

    const rowNumber = await findRowNumberByEmail(process.env.SHEET_ID, studentEmail);
    if (!rowNumber) {
      return res.status(404).json({ error: "Student not found" });
    }

    const actualColumn = `${activity} - Actual`;
    // Leave FileURL unchanged (pass undefined)
    await writeStudentActual(process.env.SHEET_ID, rowNumber, actualColumn, `${activity} - FileURL`, date, undefined);

    // Optionally notify supervisor
    if (emailEnabled) {
      try {
        const rows = await readMasterTracking(process.env.SHEET_ID);
        const studentRow = rows[rowNumber - 2];
        const supervisorEmail = studentRow["Main Supervisor's Email"] || studentRow["Main Supervisor"];

        if (supervisorEmail) {
          await sendgrid.send({
            to: supervisorEmail,
            from: process.env.NOTIFY_FROM_EMAIL,
            subject: `PPBMS: ${studentRow["Student Name"]} updated ${activity} date`,
            text: `${studentRow["Student Name"]} set "${activity}" to ${date}.`,
          });
        }
      } catch (emailErr) {
        console.warn("Email notify failed:", emailErr?.message || emailErr);
      }
    }

    return res.json({ ok: true, message: "Date updated", date });
  } catch (e) {
    console.error("DATE-ONLY ERROR:", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

export default router;
