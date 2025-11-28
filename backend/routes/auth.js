import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email required" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const clean = email.toLowerCase().trim();

    // 1️⃣ Check student
    let row = rows.find(
      r => r["Student's Email"]?.toLowerCase().trim() === clean
    );
    if (row) {
      const token = jwt.sign(
        { email: clean, role: "student" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        token,
        role: "student",
        email: clean
      });
    }

    // 2️⃣ Check supervisor
    row = rows.find(
      r => r["Main Supervisor's Email"]?.toLowerCase().trim() === clean
    );
    if (row) {
      const token = jwt.sign(
        { email: clean, role: "supervisor" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        token,
        role: "supervisor",
        email: clean
      });
    }

    return res.status(401).json({ error: "Email not found in system" });

  } catch (err) {
    console.error("AUTH LOGIN ERROR", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
