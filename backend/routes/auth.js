import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

// SIMPLE LOGIN — email only
router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email required" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    // Check if email exists in supervisor or student columns
    const student = rows.find(
      r => r["Student's Email"]?.toLowerCase() === email.toLowerCase()
    );

    const supervisor = rows.find(
      r => r["Main Supervisor's Email"]?.toLowerCase() === email.toLowerCase()
    );

    if (!student && !supervisor) {
      return res.status(401).json({ error: "Email not found" });
    }

    // token = just the email (no password needed)
    return res.json({
      token: email,
      email,
      role: supervisor ? "supervisor" : "student",
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
