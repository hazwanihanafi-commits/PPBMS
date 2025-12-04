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

// ADMIN LOGIN (Universal password)
router.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;

  // Approved admin list
  const admins = [
    "hazwanihanafi@usm.my",
    "ppbms.admin@usm.my"
  ];

  const cleanEmail = email.toLowerCase().trim();

  // Check email
  if (!admins.includes(cleanEmail)) {
    return res.status(401).json({ error: "Not an admin" });
  }

  // ⭐ UNIVERSAL PASSWORD
  const UNIVERSAL_ADMIN_PASSWORD = "admin123";

  if (password !== UNIVERSAL_ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong password" });
  }

  // Issue JWT token
  const token = jwt.sign(
    { email: cleanEmail, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({ token, role: "admin" });
});

export default router;
