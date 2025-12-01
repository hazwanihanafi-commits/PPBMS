// backend/routes/tasks.js
import express from "express";
import formidable from "formidable";
import fs from "fs";
import { google } from "googleapis";
import sendgrid from "@sendgrid/mail";
import { readMasterTracking, writeStudentActual } from "../services/googleSheets.js";
import auth from "../utils/authMiddleware.js"; // ensure exists and sets req.user

const router = express.Router();
sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

// helper to find master row index (sheet row number)
async function findRowNumberByEmail(sheetId, studentEmail) {
  const rows = await readMasterTracking(sheetId);
  const idx = rows.findIndex(r => ((r["Student's Email"] || "").toLowerCase().trim() === (studentEmail || "").toLowerCase().trim()));
  if (idx === -1) return null;
  return idx + 2; // header row at 1
}

router.post("/upload", auth, async (req, res) => {
  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(400).json({ error: "invalid form" });
      const { studentEmail, activity } = fields;
      if (!studentEmail || !activity) return res.status(400).json({ error: "Missing fields" });
      const file = files.file;
      if (!file) return res.status(400).json({ error: "Missing file" });

      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const authClient = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"]
      });
      const client = await authClient.getClient();
      const drive = google.drive({ version: "v3", auth: client });

      const driveRes = await drive.files.create({
        requestBody: { name: file.originalFilename || `upload_${Date.now()}`, parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : undefined },
        media: { mimeType: file.mimetype, body: fs.createReadStream(file.filepath) },
        fields: "id"
      });

      const fileId = driveRes.data.id;
      try {
        await drive.permissions.create({ fileId, requestBody: { role: "reader", type: "anyone" }});
      } catch (e) { /* ignore permission errors */ }

      const url = `https://drive.google.com/file/d/${fileId}/view`;
      const sheetRow = await findRowNumberByEmail(process.env.SHEET_ID, studentEmail);
      if (!sheetRow) return res.status(404).json({ error: "student not found" });

      const actualColumn = `${activity} - Actual`;
      const urlColumn = `${activity} - FileURL`;
      const today = new Date().toISOString().slice(0,10);

      await writeStudentActual(process.env.SHEET_ID, sheetRow, actualColumn, urlColumn, today, url);

      // send notify email to supervisor
      try {
        const rows = await readMasterTracking(process.env.SHEET_ID);
        const rowData = rows[sheetRow - 2];
        const supEmail = rowData["Main Supervisor's Email"] || rowData["Main Supervisor"];
        if (supEmail && process.env.NOTIFY_FROM_EMAIL && process.env.SENDGRID_API_KEY) {
          await sendgrid.send({
            to: supEmail,
            from: process.env.NOTIFY_FROM_EMAIL,
            subject: `PPBMS: ${rowData["Student Name"]} uploaded ${activity}`,
            text: `${rowData["Student Name"]} uploaded ${activity}. Please review.`
          });
        }
      } catch (e) {
        console.warn("notify error", e?.message || e);
      }

      return res.json({ ok: true, url });
    } catch (e) {
      console.error("upload err", e);
      return res.status(500).json({ error: e.message });
    }
  });
});

export default router;
