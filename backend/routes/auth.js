import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// TEMP HARD-CODED ACCOUNTS
const USERS = [
  {
    email: "hazwanihanafi@usm.my",
    role: "supervisor",
    password: "12345", // temporary
  },
  {
    email: "cao@student.usm.my",
    role: "student",
    password: "12345",
  }
];

// LOGIN ENDPOINT
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid login" });
  }

  const token = jwt.sign(
    { email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({
    success: true,
    email: user.email,
    role: user.role,
    token,
  });
});

export default router;
