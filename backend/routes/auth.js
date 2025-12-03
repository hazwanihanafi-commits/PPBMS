import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// POST /auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Missing credentials" });

  // TEMP valid test login
  const hardcoded = {
    "cao@student.usm.my": "1234",
    "supervisor@usm.my": "1234"
  };

  if (!hardcoded[email])
    return res.status(401).json({ error: "Invalid email" });

  if (hardcoded[email] !== password)
    return res.status(401).json({ error: "Wrong password" });

  const token = jwt.sign({ email }, process.env.JWT_SECRET);

  return res.json({
    token,
    role: email.includes("supervisor") ? "supervisor" : "student"
  });
});

export default router;
