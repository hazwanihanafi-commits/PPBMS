import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { mapEmailToRole } from '../services/roles.js';

dotenv.config();
const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /auth/verify  { idToken }
router.post('/verify', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'Missing idToken' });
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = payload.email;
    const email_verified = payload.email_verified;
    const hd = payload.hd || '';
    if (!email_verified) return res.status(403).json({ error: 'Email not verified' });
    // optional domain check
    if (process.env.ALLOWED_GSUITE_DOMAIN && !hd.includes(process.env.ALLOWED_GSUITE_DOMAIN)) {
      return res.status(403).json({ error: 'Unauthorized domain' });
    }
    // map role
    const role = await mapEmailToRole(email);
    const token = jwt.sign({ email, role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '8h' });
    return res.json({ token, email, role });
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: 'Invalid idToken' });
  }
});

export default router;
