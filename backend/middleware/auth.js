// middleware/auth.js
import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Expecting: "Bearer token"
  const token = header.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { matric: "...", email: "...", role: "student" }
    next();
  } catch (err) {
    console.error("AUTH FAIL:", err.message);
    res.status(401).json({ error: "Token expired or invalid" });
  }
}
