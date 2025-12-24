import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { readMasterTracking } from "../services/googleSheets.js";
import { getAuthUser, saveAuthUser } from "../services/authStore.js";

const router = express.Router();
const resetTokens = {};

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing credentials" });
  const cleanEmail = email.toLowerCase().trim();

  const rows = await readMasterTracking(process.env.SHEET_ID);
  const student = rows.find(r => (r["Student's Email"] || "").toLowerCase().trim() === cleanEmail);
  const supervisor = rows.find(r => (r["Main Supervisor's Email"] || "").toLowerCase().trim() === cleanEmail);
  if (!student && !supervisor) return res.status(403).json({ error: "ACCESS_DENIED" });

  const authUser = await getAuthUser(cleanEmail);
  if (!authUser) return res.status(401).json({ error: "PASSWORD_NOT_SET" });

  const ok = await bcrypt.compare(password, authUser.password_hash);
  if (!ok) return res.status(401).json({ error: "INVALID_PASSWORD" });

  const role = supervisor ? "supervisor" : "student";
  const token = jwt.sign({ email: cleanEmail, role }, process.env.JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, role });
});

router.post("/request-set-password", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Missing email" });
  const cleanEmail = email.toLowerCase().trim();

  const rows = await readMasterTracking(process.env.SHEET_ID);
  const exists = rows.some(r =>
    (r["Student's Email"] || "").toLowerCase().trim() === cleanEmail ||
    (r["Main Supervisor's Email"] || "").toLowerCase().trim() === cleanEmail
  );
  if (!exists) return res.status(403).json({ error: "ACCESS_DENIED" });

  const token = crypto.randomBytes(32).toString("hex");
  resetTokens[token] = { email: cleanEmail, expires: Date.now() + 15 * 60 * 1000 };

  console.log(`SET PASSWORD LINK: ${process.env.FRONTEND_URL}/set-password?token=${token}`);
  res.json({ message: "Password setup link sent" });
});

router.post("/set-password", async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: "Missing data" });

  const record = resetTokens[token];
  if (!record || record.expires < Date.now())
    return res.status(400).json({ error: "Invalid or expired token" });

  const hash = await bcrypt.hash(password, 12);
  await saveAuthUser(record.email, { password_hash: hash });

  delete resetTokens[token];
  res.json({ message: "Password set successfully" });
});

export default router;
