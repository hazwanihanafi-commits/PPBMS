// backend/routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

/* ============================================================
   UNIVERSAL LOGIN (STUDENT + SUPERVISOR)
   - Students login using Student’s Email
   - Supervisors login using Main Supervisor’s Email
   - Password for both = "1234"
   ============================================================ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });

    if (password !== "1234")
      return res.status(401).json({ error: "Wrong password" });

    const cleanEmail = email.toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    // Check if email matches student
    const student = rows.find(
      (r) =>
        (r["Student's Email"] || "").toLowerCase().trim() === cleanEmail
    );

    // Check if email matches supervisor
    const supervisor = rows.find(
      (r) =>
        (r["Main Supervisor's Email"] || "").toLowerCase().trim() === cleanEmail
    );

    if (!student && !supervisor)
      return res.status(401).json({ error: "Email not found in system" });

    const role = supervisor ? "supervisor" : "student";

    // JWT Token
    const token = jwt.sign(
      { email: cleanEmail, role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token, role });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   ADMIN LOGIN (EMAIL + PASSWORD FROM ENV)
   - ADMIN_EMAIL
   - ADMIN_PASSWORD
   ------------------------------------------------------------
   Env example:
   ADMIN_EMAIL=ppbmsadmin@usm.my
   ADMIN_PASSWORD=BAA1234
   ============================================================ */
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Missing email or password" });

    const cleanEmail = email.toLowerCase().trim();

    // Load ENV credentials
    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

    // Validate env variables exist
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error("❌ ADMIN_EMAIL or ADMIN_PASSWORD not set in server environment");
      return res.status(500).json({
        error: "Admin login is not configured on the server (missing env variables)",
      });
    }

    // Validate email
    if (cleanEmail !== ADMIN_EMAIL) {
      return res.status(401).json({ error: "Email not recognized as admin" });
    }

    // Validate password
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
