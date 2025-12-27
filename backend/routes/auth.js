import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  readAuthUsers,
  updatePasswordHash
} from "../services/googleSheets.js";

const router = express.Router();

/* =====================================================
   LOGIN
===================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const user = rows.find(
      r =>
        (r["Student's Email"] || "").toLowerCase().trim() === normalizedEmail ||
        (r["Main Supervisor's Email"] || "").toLowerCase().trim() === normalizedEmail
    );

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const role = detectRole(user, normalizedEmail);

    /* ===== FIRST LOGIN ===== */
    if (!user.PASSWORD_HASH) {
      return res.json({
        requirePasswordSetup: true,
        email: normalizedEmail,
        role
      });
    }

    if (!password) {
      return res.status(400).json({ error: "Password required" });
    }

    const ok = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!ok) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      {
        email: normalizedEmail,
        role
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      token,
      role,
      email: normalizedEmail
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
});


/* =====================================================
   SET PASSWORD (RUNS ONCE ONLY)
===================================================== */
router.post("/set-password", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing data" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const rows = await readMasterTracking(process.env.SHEET_ID);
    const user = rows.find(
      r =>
        (r["Student's Email"] || "").toLowerCase().trim() === normalizedEmail ||
        (r["Main Supervisor's Email"] || "").toLowerCase().trim() === normalizedEmail
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.PASSWORD_HASH) {
      return res.status(400).json({ error: "Password already set" });
    }

    const hash = await bcrypt.hash(password, 10);

    await updatePasswordHash({
      email: normalizedEmail,
      hash
    });

    res.json({ success: true });

  } catch (err) {
    console.error("SET PASSWORD ERROR:", err);
    res.status(500).json({ error: "Failed to set password" });
  }
});

/* =====================================================
   ROLE DETECTION
===================================================== */
function detectRole(row, loginEmail) {
  const email = loginEmail.toLowerCase().trim();

  // Supervisor must be checked FIRST
  if (
    (row["Main Supervisor's Email"] || "")
      .toLowerCase()
      .trim() === email
  ) {
    return "supervisor";
  }

  if (
    (row["Student's Email"] || "")
      .toLowerCase()
      .trim() === email
  ) {
    return "student";
  }

  return "admin";
}

export default router;
