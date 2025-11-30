// backend/routes/tasks.js
import express from "express";
import { readMasterTracking, writeToSheet } from "../services/googleSheets.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// find row index (1-based row number in sheet) for student email
async function findStudentRow(sheetId, sheetName, studentEmail) {
  const rows = await readMasterTracking(sheetId);
  // rows is array of objects; we need index of matching Student's Email
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if ((r["Student's Email"] || "").toLowerCase() === (studentEmail || "").toLowerCase()) {
      // data rows start at row 2 (header at row1) -> sheet row number = i+2
      return i + 2;
    }
  }
  return null;
}

// POST /api/tasks/toggle
// { studentEmail, key, value }  value = "TRUE" or "" (empty)
router.post("/toggle", async (req, res) => {
  try {
    const { studentEmail, key, value } = req.body;
    if (!studentEmail || !key) return res.status(400).json({ error: "Missing studentEmail or key" });

    const sheetId = process.env.SHEET_ID;
    const sheetName = "MasterTracking";

    const rowNumber = await findStudentRow(sheetId, sheetName, studentEmail);
    if (!rowNumber) return res.status(404).json({ error: "Student not found" });

    // write value to the column name `key`
    await writeToSheet(sheetId, sheetName, rowNumber, key, value);

    // also write a date column (key + " Date") when setting TRUE
    if (value && value.toLowerCase() === "true") {
      const now = new Date().toISOString();
      await writeToSheet(sheetId, sheetName, rowNumber, `${key} Date`, now);
    } else {
      // clear date if tick removed
      await writeToSheet(sheetId, sheetName, rowNumber, `${key} Date`, "");
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("toggle error", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// POST /api/tasks/upload
// { studentEmail, key, url }
router.post("/upload", async (req, res) => {
  try {
    const { studentEmail, key, url } = req.body;
    if (!studentEmail || !key || !url) return res.status(400).json({ error: "Missing required fields" });

    const sheetId = process.env.SHEET_ID;
    const sheetName = "MasterTracking";
    const rowNumber = await findStudentRow(sheetId, sheetName, studentEmail);
    if (!rowNumber) return res.status(404).json({ error: "Student not found" });

    // write the URL into the sheet column with header key (or "Submission Document <P>")
    await writeToSheet(sheetId, sheetName, rowNumber, key, url);
    // mark the item as True/Completed
    await writeToSheet(sheetId, sheetName, rowNumber, key + " Date", new Date().toISOString());
    await writeToSheet(sheetId, sheetName, rowNumber, key + " Uploaded", "TRUE");

    return res.json({ ok: true });
  } catch (err) {
    console.error("upload error", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// POST /api/tasks/notify (example with SendGrid)
// { email, subject, message }
router.post("/notify", async (req, res) => {
  try {
    const { email, subject, message } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });
    const sg = process.env.SENDGRID_API_KEY;
    if (!sg) return res.status(500).json({ error: "SendGrid not configured" });

    // simple example using node-fetch, ensure node-fetch is installed OR use @sendgrid/mail
    const sendgrid = require("@sendgrid/mail");
    sendgrid.setApiKey(sg);
    await sendgrid.send({
      to: email,
      from: process.env.NOTIFY_FROM || "no-reply@example.com",
      subject: subject || "PPBMS notification",
      text: message || "",
      html: `<p>${message || ""}</p>`,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("notify error", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
