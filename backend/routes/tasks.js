// backend/routes/tasks.js
import express from "express";
import { readMasterTracking, writeToSheet } from "../services/googleSheets.js";
import sendEmail from "../services/sendEmail.js";

const router = express.Router();
const SHEET = process.env.SHEET_ID;

/**
 * 1️⃣ Toggle Task Completed by Student
 * BODY: { email, taskName, completed }
 */
router.post("/toggle", async (req, res) => {
  try {
    const { email, taskName, completed } = req.body;

    const rows = await readMasterTracking(SHEET);
    const idx = rows.findIndex((r) => r["Student's Email"] === email);

    if (idx === -1) return res.status(404).json({ error: "Student not found" });

    const rowNumber = idx + 2; // because header is row 1
    const value = completed ? "DONE" : "";

    await writeToSheet(SHEET, "MasterTracking", rowNumber, taskName, value);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2️⃣ Supervisor Approval of Task
 * BODY: { email, taskName }
 */
router.post("/approve", async (req, res) => {
  try {
    const { email, taskName } = req.body;

    const rows = await readMasterTracking(SHEET);
    const idx = rows.findIndex((r) => r["Student's Email"] === email);

    if (idx === -1) return res.status(404).json({ error: "Student not found" });

    const rowNumber = idx + 2;

    await writeToSheet(SHEET, "MasterTracking", rowNumber, taskName, "APPROVED");

    // send notification
    await sendEmail({
      to: email,
      subject: `Task Approved: ${taskName}`,
      text: `Your supervisor has approved your task: ${taskName}`,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3️⃣ Get student's task list
 */
router.get("/list/:email", async (req, res) => {
  try {
    const email = req.params.email;

    const rows = await readMasterTracking(SHEET);
    const student = rows.find((r) => r["Student's Email"] === email);

    if (!student) return res.status(404).json({ error: "Student not found" });

    res.json({ student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
