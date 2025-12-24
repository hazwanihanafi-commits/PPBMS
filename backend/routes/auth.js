import express from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();
const USERS_FILE = path.resolve("backend/data/users.json");

// Ensure users.json exists
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "{}");
}

/* ============================================================
   STUDENT & SUPERVISOR LOGIN
   POST /auth/login
===============================================================*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const cleanEmail = email.toLowerCase().trim();

    // Check email exists in Google Sheet
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const isStudent = rows.some(
      r => (r["Student's Email"] || "").toLowerCase().trim() === cleanEmail
    );
    const isSupervisor = rows.some(
      r => (r["Main Supervisor's Email"] || "").toLowerCase().trim() === cleanEmail
    );

    if (!isStudent && !isSupervisor) {
      return res.status(403).json({ error: "ACCESS_DENIED" });
    }

    // Load users
    const users = JSON.parse(fs.readFileSync(USERS_FILE));
    const user = users[cleanEmail];

    // First-time login
    if (!user) {
      return res.status(403).json({ error: "PASSWORD_NOT_SET" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Wrong password" });
    }

    const role = isSupervisor ? "supervisor" : "student";

    const token = jwt.sign(
      { email: cleanEmail, role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.json({ token, role });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   FIRST-TIME PASSWORD SET
   POST /auth/set-password
===============================================================*/
router.post("/set-password", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "Missing data" });

    if (password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters" });

    const cleanEmail = email.toLowerCase().trim();

    // Check email exists in Google Sheet
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const allowed = rows.some(
      r =>
        (r["Student's Email"] || "").toLowerCase().trim() === cleanEmail ||
        (r["Main Supervisor's Email"] || "").toLowerCase().trim() === cleanEmail
    );

    if (!allowed) {
      return res.status(403).json({ error: "ACCESS_DENIED" });
    }

    const users = JSON.parse(fs.readFileSync(USERS_FILE));

    users[cleanEmail] = {
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: new Date().toISOString()
    };

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    return res.json({ success: true });

  } catch (err) {
    console.error("SET PASSWORD ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
