import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { readAuthUsers, updateAuthUserPassword } from "../services/authUsers.js";

const router = express.Router();

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

    // 🔐 First login → force password setup
    if (!user.PasswordHash) {
      return res.json({
        requirePasswordSetup: true,
        email: normalizedEmail
      });
    }

    if (!password) {
      return res.status(400).json({ error: "Password required" });
    }

    const ok = await bcrypt.compare(password, user.PasswordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      {
        email: normalizedEmail,
        role: user.Role
      },
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

export default router;
