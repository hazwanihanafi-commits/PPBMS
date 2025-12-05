import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

/* ============================================================
   UNIVERSAL LOGIN (Student + Supervisor)
   ------------------------------------------------------------
   - Checks Google Sheet for matching email
   - Determines role based on columns
===============================================================*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });

    if (password !== "1234")
      return res.status(401).json({ error: "Wrong password" });

    const cleanEmail = email.toLowerCase().trim();

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const student = rows.find(
      (r) =>
        (r["Student's Email"] || "").toLowerCase().trim() === cleanEmail
    );

    const supervisor = rows.find(
      (r) =>
        (r["Main Supervisor's Email"] || "").toLowerCase().trim() === cleanEmail
    );

    // student OR supervisor must exist
    if (!student && !supervisor)
      return res.status(401).json({ error: "Email not found in system" });

    const role = supervisor ? "supervisor" : "student";

    const token = jwt.sign(
      { email: cleanEmail, role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token, role });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ADMIN LOGIN (uses .env)
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const cleanEmail = email.toLowerCase().trim();

    // Read from .env
    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

    // Check email
    if (cleanEmail !== ADMIN_EMAIL) {
      return res.status(401).json({ error: "Not an admin" });
    }

    // Check password
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Wrong password" });
    }

    // Issue token
    const token = jwt.sign(
      { email: cleanEmail, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token, role: "admin" });

  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});


export default router;
