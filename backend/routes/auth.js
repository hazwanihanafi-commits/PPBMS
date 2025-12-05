import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

/* ============================================================
   UNIVERSAL LOGIN (Student + Supervisor)
   ------------------------------------------------------------
   - Reads Google Sheet
   - Matches email in:
       • Student's Email
       • Main Supervisor's Email
   - Password for both = STUDENT_SUPERVISOR_PASSWORD (env)
===============================================================*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const cleanEmail = email.toLowerCase().trim();

    // Load universal password for students/supervisors
    const UNIV_PASS = process.env.STUDENT_SUPERVISOR_PASSWORD || "1234";

    if (password !== UNIV_PASS)
      return res.status(401).json({ error: "Wrong password" });

    // Read Google Sheet
    const rows = await readMasterTracking(process.env.SHEET_ID);

    // Check student row
    const student = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === cleanEmail
    );

    // Check supervisor row
    const supervisor = rows.find(
      r => (r["Main Supervisor's Email"] || "").toLowerCase().trim() === cleanEmail
    );

    // No match
    if (!student && !supervisor)
      return res.status(401).json({ error: "Email not found in system" });

    // Determine role
    const role = supervisor ? "supervisor" : "student";

    // Create token
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


/* ============================================================
   ADMIN LOGIN (separate credentials)
===============================================================*/
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || "";

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ error: "Admin credentials missing" });
    }

    // Compare login input with env
    if (email.toLowerCase().trim() !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ error: "Wrong password" });
    }

    // Generate token for admin
    const token = jwt.sign(
      { email: adminEmail, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token, role: "admin" });

  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
