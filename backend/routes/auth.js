// backend/routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ error: "Email required" });

  const token = jwt.sign(
    { email, role: email.endsWith("@usm.my") ? "admin" : "student" },
    process.env.JWT_SECRET,
    { expiresIn: "10h" }
  );

  return res.json({ token });
});

export default router;
