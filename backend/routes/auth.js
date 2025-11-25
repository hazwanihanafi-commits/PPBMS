import express from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// FRONTEND EXPECTS THIS ROUTE
router.post("/verify", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    // Verify Google Login Token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    // Only allow USM
    if (!email.endsWith("@usm.my")) {
      return res.status(403).json({ error: "Only USM accounts allowed" });
    }

    // Default role now (can extend later)
    const role = "student";

    // Sign app JWT token
    const token = jwt.sign(
      { email, role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token, email, role });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return res.status(500).json({ error: "Verify failed" });
  }
});

export default router;
