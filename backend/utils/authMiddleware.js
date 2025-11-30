// backend/utils/authMiddleware.js
import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded should contain e.g. { email, name, role, iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Optional helper to require supervisor role
export function requireSupervisor(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  if (req.user.role !== "supervisor" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: supervisor only" });
  }
  next();
}
