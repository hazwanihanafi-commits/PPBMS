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

    const normalizedEmail = email.toLowerCase().trim();
    const users = await readAuthUsers(process.env.SHEET_ID);

    const user = users.find(
      u => (u.Email || "").toLowerCase().trim() === normalizedEmail
    );

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // 🔐 FIRST LOGIN → FORCE PASSWORD SET
    if (!user.PasswordHash || user.PasswordSet !== "TRUE") {
      return res.status(403).json({
        error: "PASSWORD_NOT_SET",
        requirePasswordSetup: true,
        email: normalizedEmail,
        role: (user.Role || "").trim().toLowerCase(),
      });
    }

    // 🔑 PASSWORD CHECK
    if (!password) {
      return res.status(400).json({ error: "Password required" });
    }

    const ok = await bcrypt.compare(password, user.PasswordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const role = (user.Role || "").trim().toLowerCase();
    if (!["student", "supervisor", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role assigned" });
    }

    const token = jwt.sign(
      { email: normalizedEmail, role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.json({ token, role, email: normalizedEmail });

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

    const users = await readAuthUsers(process.env.SHEET_ID);

    const user = users.find(
      u => (u.Email || "").toLowerCase().trim() === email
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ BLOCK RESET ONLY IF PASSWORDSET IS TRUE
    if (user.PasswordSet === "TRUE") {
      return res.status(400).json({ error: "Password already set" });
    }

    const hash = await bcrypt.hash(password, 10);

    // ✅ WRITE BOTH HASH + FLAG
    await updateAuthUserPassword({
      sheetId: process.env.SHEET_ID,
      email,
      hash,
      passwordSet: "TRUE"
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("SET PASSWORD ERROR:", err);
    return res.status(500).json({ error: "Failed to set password" });
  }
});

export default router;
