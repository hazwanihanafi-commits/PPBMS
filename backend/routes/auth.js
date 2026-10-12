import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { readAuthUsers, updateAuthUserPassword, updateAuthResetFields } from '../services/googleSheets.js';
import sendEmail from '../services/sendEmail.js';

const router = express.Router();
const normalize = value => String(value || '').trim().toLowerCase();
const genericMessage = 'If this email is registered, a password setup/reset link will be sent.';
const frontendUrl = (process.env.FRONTEND_URL || 'https://ppbms.my').replace(/\/$/, '');
const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
const validPassword = value => typeof value === 'string' && value.length >= 12 && value.length <= 128;

router.post('/login', async (req, res) => {
  try {
    const email = normalize(req.body?.email);
    const password = req.body?.password;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const users = await readAuthUsers(process.env.SHEET_ID);
    const user = users.find(u => normalize(u.Email) === email);
    // Do not reveal account existence or setup state.
    if (!user || !user.PasswordHash || String(user.PasswordSet).trim().toUpperCase() !== 'TRUE') {
      return res.status(401).json({ error: 'Invalid credentials. Use Forgot Password to set or reset your password.' });
    }
    if (!await bcrypt.compare(password, user.PasswordHash)) return res.status(401).json({ error: 'Invalid credentials' });
    const role = normalize(user.Role);
    if (!['student', 'supervisor', 'admin'].includes(role)) return res.status(403).json({ error: 'Account unavailable' });
    const token = jwt.sign({ email, role }, process.env.JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, role, email });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const email = normalize(req.body?.email);
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }
    const users = await readAuthUsers(process.env.SHEET_ID);
    const user = users.find(u => normalize(u.Email) === email);
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await updateAuthResetFields({ sheetId: process.env.SHEET_ID, email, tokenHash: hashToken(token), expires });
      const url = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
      try {
        await sendEmail({ to: email, subject: 'PPBMS password setup/reset', text: `A password setup/reset was requested for your PPBMS account.\n\nOpen this link within 30 minutes:\n${url}\n\nIf you did not request this, ignore this email.`, });
      } catch (err) {
        console.error('PASSWORD RESET EMAIL ERROR:', err);
        // Don't leak account existence to the caller.
      }
    }
    return res.json({ message: genericMessage });
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    return res.json({ message: genericMessage });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const email = normalize(req.body?.email);
    const { token, password } = req.body || {};
    if (!email || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || !validPassword(password)) {
      return res.status(400).json({ error: 'Invalid reset request or password. Password must be 12–128 characters.' });
    }
    const users = await readAuthUsers(process.env.SHEET_ID);
    const user = users.find(u => normalize(u.Email) === email);
    const providedHash = Buffer.from(hashToken(token), 'hex');
    const storedHash = /^[a-f0-9]{64}$/i.test(user?.ResetTokenHash || '') ? Buffer.from(user.ResetTokenHash, 'hex') : Buffer.alloc(32);
    const valid = crypto.timingSafeEqual(providedHash, storedHash) &&
      !!user?.ResetTokenHash && Number.isFinite(Date.parse(user.ResetTokenExpires)) &&
      Date.parse(user.ResetTokenExpires) > Date.now();
    if (!valid) return res.status(400).json({ error: 'Reset link is invalid or expired. Request another link.' });
    const hash = await bcrypt.hash(password, 12);
    await updateAuthUserPassword({ sheetId: process.env.SHEET_ID, email, hash });
    await updateAuthResetFields({ sheetId: process.env.SHEET_ID, email, tokenHash: '', expires: '' });
    return res.json({ success: true });
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    return res.status(500).json({ error: 'Unable to reset password' });
  }
});

// SECURITY: Remove the old unauthenticated /set-password endpoint entirely.
// First-time users now use the same verified email link flow.
export default router;
