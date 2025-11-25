// backend/routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();

// Google client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/verify", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const email = payload.email;
    const hd = payload.hd; // domain (e.g., usm.my)

    // Restrict to USM only
    if (hd !== "usm.my") {
      return res.status(403).json({ error: "Only USM accounts allowed" });
    }

    // Create JWT token for backend use
    const jwtToken = jwt.sign(
      {
        email,
        name: payload.name,
        role: "student", // can update later with supervisor/admin logic
      },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "12h" }
    );

    return res.json({ token: jwtToken });
  } catch (err) {
    console.error("Auth verify error:", err);
    return res.status(500).json({ error: "Failed to verify token" });
  }
});

export default router;
