// backend/routes/tasks.js
import express from "express";
import multer from "multer";
import { google } from "googleapis";
import { Readable } from "stream";
import { readMasterTracking, writeStudentActual } from "../services/googleSheets.js";
import auth from "../utils/authMiddleware.js";

const router = express.Router();

// Use Multer with memory storage (NO file path needed)
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { studentEmail, activity } = req.body;

    if (!studentEmail || !activity)
      return res.status(400).json({ error: "Missing fields" });

    if (!file)
      return res.status(400).json({ error: "File missing" });

    // Google Drive Auth
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const authClient = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.file"]
    });

    const client = await authClient.getClient();
    const drive = google.drive({ version: "v3", auth: client });

    // Upload using buffer — NO PATH REQUIRED
    const uploadRes = await drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
      },
      media: {
        mimeType: file.mimetype,
        body: Readable.from(file.buffer)
      },
      fields: "id"
    });

    const fileId = uploadRes.data.id;
    const fileURL = `https://drive.google.com/file/d/${fileId}/view`;

    // Make file public
    try {
      await drive.permissions.create({
        fileId,
        requestBody: { role: "reader", type: "anyone" }
      });
    } catch (e) {
      console.warn("Permission error:", e.message);
    }

    // Find student row
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase().trim() === studentEmail.toLowerCase().trim()
    );

    if (idx === -1)
      return res.status(404).json({ error: "Student not found" });

    const rowNumber = idx + 2;
    const today = new Date().toISOString().substring(0, 10);

    // Update actual date + file URL
    await writeStudentActual(
      process.env.SHEET_ID,
      rowNumber,
      `${activity} - Actual`,
      `${activity} - FileURL`,
      today,
      fileURL
    );

    return res.json({ ok: true, url: fileURL, date: today });

  } catch (e) {
    console.error("upload error:", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
