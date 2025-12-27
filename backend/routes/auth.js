import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { readSheet, writeSheetCell } from "../services/googleSheets.js";

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

    // 🔹 FIRST LOGIN → FORCE SET PASSWORD
    if (!user.PasswordHash) {
      return res.json({
        requirePasswordSetup: true,
        email: normalizedEmail,
        role: user.Role
      });
    }

    // 🔹 PASSWORD REQUIRED AFTER SET
    if (!password) {
      return res.status(400).json({ error: "Password required" });
    }

    const ok = await bcrypt.compare(password, user.PasswordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // 🔹 ISSUE JWT
    const token = jwt.sign(
      { email: normalizedEmail, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      token,
      role: user.Role,
      email: normalizedEmail
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* =====================================================
   SET PASSWORD (RUNS ONCE)
===================================================== */
router.post("/set-password", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing data" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const users = await readSheet(
      process.env.SHEET_ID,
      "AUTH_USERS!A1:Z"
    );

    const rowIndex =
      users.findIndex(
        u => (u.Email || "").toLowerCase().trim() === normalizedEmail
      ) + 2; // +2 because header + 1-based index

    if (rowIndex < 2) {
      return res.status(404).json({ error: "User not found" });
    }

    const hash = await bcrypt.hash(password, 10);

    // 🔹 UPDATE PASSWORD HASH
    await writeSheetCell(
      process.env.SHEET_ID,
      "PasswordHash",
      rowIndex,
      hash
    );

    // 🔹 MARK PASSWORD SET
    await writeSheetCell(
      process.env.SHEET_ID,
      "PasswordSet",
      rowIndex,
      "YES"
    );

    res.json({ success: true });

  } catch (err) {
    console.error("SET PASSWORD ERROR:", err);
    res.status(500).json({ error: "Failed to set password" });
  }
});

export default router;
