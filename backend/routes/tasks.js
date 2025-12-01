// backend/routes/tasks.js
import express from "express";
import formidable from "formidable";
import { google } from "googleapis";
import fs from "fs";
import { writeStudentActual } from "../services/googleSheets.js";

const router = express.Router();

// UPLOAD submission for mandatory items
router.post("/upload", async (req, res) => {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    try {
      const { sheetId, activity } = fields;
      if (!sheetId || !activity) return res.status(400).json({ error: "Missing fields" });

      const file = files.file;
      if (!file) return res.status(400).json({ error: "Missing file" });

      // Upload to drive
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
        scopes: ["https://www.googleapis.com/auth/drive.file"]
      });
      const client = await auth.getClient();
      const drive = google.drive({ version: "v3", auth: client });

      const driveRes = await drive.files.create({
        requestBody: { name: file.originalFilename },
        media: { mimeType: file.mimetype, body: fs.createReadStream(file.filepath) },
        fields: "id"
      });

      const fileId = driveRes.data.id;
      const url = `https://drive.google.com/file/d/${fileId}/view`;

      const today = new Date().toISOString().slice(0, 10);

      // Write to sheet
      await writeStudentActual(sheetId, activity, url, today);

      res.json({ ok: true, url });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

export default router;
