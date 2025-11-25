import express from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();
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
    const hd = payload.hd; // domain

    // Check USM domain
    if (hd !== "usm.my") {
      return res.status(403).json({ error: "Only USM accounts allowed" });
    }

    // Create JWT
    const token = jwt.sign(
      { email, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({ token });

  } catch (err) {
    console.error("Verify error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
