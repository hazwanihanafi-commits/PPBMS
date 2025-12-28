import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  readSheet,
  readAuthUsers,
  updateAuthUserPassword
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

    // ✅ NORMALIZE EMAIL ONCE
    const normalizedEmail = email.toLowerCase().trim();

    // 🔹 READ AUTH_USERS SHEET
    const users = await readSheet(
      process.env.SHEET_ID,
      "AUTH_USERS!A1:Z"
    );

    const user = users.find(
      u => (u.Email || "").toLowerCase().trim() === normalizedEmail
    );

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    /* ================= FIRST LOGIN ================= */
    if (!user.PasswordHash) {
      return res.json({
        requirePasswordSetup: true,
        email: normalizedEmail,
        role: user.Role
      });
    }

    /* ================= PASSWORD CHECK ================= */
    if (!password) {
      return res.status(400).json({ error: "Password required" });
    }

    const ok = await bcrypt.compare(password, user.PasswordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid password" });
    }

    /* ================= ISSUE JWT ================= */
    const token = jwt.sign(
      {
        email: normalizedEmail,
        role: user.Role
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.json({
      token,
      role: user.Role,
      email: normalizedEmail
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

/* =====================================================
   SET PASSWORD (RUNS ONLY ONCE)
===================================================== */
router.post("/set-password", async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    // 🔹 READ AUTH_USERS
    const users = await readAuthUsers(process.env.SHEET_ID);

    const user = users.find(
      u => (u.Email || "").toLowerCase().trim() === email
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ❌ BLOCK RESET IF PASSWORD ALREADY EXISTS
    if (user.PasswordHash) {
      return res.status(400).json({ error: "Password already set" });
    }

    // 🔐 HASH PASSWORD
    const hash = await bcrypt.hash(password, 10);

    // ✅ WRITE HASH TO AUTH_USERS
    await updateAuthUserPassword({
      sheetId: process.env.SHEET_ID,
      email,
      hash
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("SET PASSWORD ERROR:", err);
    return res.status(500).json({ error: "Failed to set password" });
  }
});

export default router;
