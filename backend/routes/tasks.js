// backend/routes/tasks.js
import express from "express";
import { readMasterTracking, writeToSheet } from "../services/googleSheets.js";
import sendEmail from "../services/sendEmail.js";

const router = express.Router();

// ---------------------------------------------------------------------
// 🔵 A. STUDENT TOGGLES A TASK
// ---------------------------------------------------------------------
router.post("/toggle", async (req, res) => {
  try {
    const { email, taskKey, value } = req.body;

    if (!email || !taskKey) {
      return res.status(400).json({ error: "Missing email or taskKey" });
    }

    const rows = await readMasterTracking(process.env.SHEET_ID);
    const index = rows.findIndex(r => r["Student's Email"] === email);

    if (index === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

    await writeToSheet(process.env.SHEET_ID, "MasterTracking", index + 2, taskKey, value);

    return res.json({ success: true, message: "Task updated" });

  } catch (err) {
    console.error("Toggle ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// 🔵 C. SUPERVISOR APPROVES TASK
// ---------------------------------------------------------------------
router.post("/approve", async (req, res) => {
  try {
    const { studentEmail, taskKey } = req.body;

    if (!studentEmail || !taskKey) {
      return res.status(400).json({ error: "Missing data" });
    }

    const rows = await readMasterTracking(process.env.SHEET_ID);
    const index = rows.findIndex(r => r["Student's Email"] === studentEmail);

    if (index === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

    await writeToSheet(process.env.SHEET_ID, "MasterTracking", index + 2, `${taskKey} Approved`, "YES");

    // ---- OPTIONAL EMAIL ----
    await sendEmail(
      studentEmail,
      `Task Approved: ${taskKey}`,
      `Your supervisor has approved: ${taskKey}`
    );

    return res.json({ success: true });

  } catch (err) {
    console.error("Approval ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// 🔵 FILE UPLOAD (GOOGLE DRIVE)
// ---------------------------------------------------------------------
router.post("/upload", async (req, res) => {
  try {
    const { studentEmail, taskKey, fileUrl } = req.body;

    if (!studentEmail || !taskKey || !fileUrl) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const rows = await readMasterTracking(process.env.SHEET_ID);
    const index = rows.findIndex(r => r["Student's Email"] === studentEmail);

    if (index === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

    await writeToSheet(
      process.env.SHEET_ID,
      "MasterTracking",
      index + 2,
      `Evidence ${taskKey}`,
      fileUrl
    );

    return res.json({ success: true });

  } catch (err) {
    console.error("Upload ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// 🔵 EMAIL NOTIFICATION
// ---------------------------------------------------------------------
router.post("/notify", async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    await sendEmail(to, subject, message);

    return res.json({ success: true });

  } catch (err) {
    console.error("Notify ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
