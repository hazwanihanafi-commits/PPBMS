// backend/routes/tasks.js
import express from "express";
import formidable from "formidable";
import fs from "fs";
import { google } from "googleapis";
import sendgrid from "@sendgrid/mail";
import { readMasterTracking, writeStudentActual } from "../services/googleSheets.mjs";
import auth from "../utils/authMiddleware.js";

const router = express.Router();
sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

router.post("/upload", auth, async (req, res) => {
  const form = formidable({ multiples: false, keepExtensions: true });
  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(400).json({ error: "Invalid form data" });

      const { studentEmail, activity } = fields;
      const file = files.file;
      if (!studentEmail || !activity) return res.status(400).json({ error: "Missing fields" });
      if (!file) return res.status(400).json({ error: "File missing" });

      const filePath = file.filepath || file.path;
      if (!filePath || !fs.existsSync(filePath)) return res.status(400).json({ error: "File path error" });

      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const authClient = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/drive.file"] });
      const client = await authClient.getClient();
      const drive = google.drive({ version: "v3", auth: client });

      const uploadRes = await drive.files.create({
        requestBody: { name: file.originalFilename || `upload_${Date.now()}`, parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] },
        media: { mimeType: file.mimetype, body: fs.createReadStream(filePath) },
        fields: "id"
      });

      const fileId = uploadRes.data.id;
      const fileURL = `https://drive.google.com/file/d/${fileId}/view`;

      try {
        await drive.permissions.create({ fileId, requestBody: { role: "reader", type: "anyone" } });
      } catch (e) { console.warn("Permission error:", e?.message || e); }

      // find row and update sheet
      const rows = await readMasterTracking(process.env.SHEET_ID);
      const idx = rows.findIndex(r => (r["Student's Email"] || "").toLowerCase().trim() === (studentEmail || "").toLowerCase().trim());
      if (idx === -1) return res.status(404).json({ error: "Student not found" });

      const rowNumber = idx + 2;
      const today = new Date().toISOString().slice(0,10);
      // write actual date + file url
      await writeStudentActual(process.env.SHEET_ID, rowNumber, `${activity} - Actual`, `${activity} - FileURL`, today, fileURL);

      // optional supervisor notify...
      return res.json({ ok: true, url: fileURL, date: today });
    } catch (e) {
      console.error("upload error:", e);
      return res.status(500).json({ error: e.message });
    }
  });
});

export default router;
