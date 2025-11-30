// backend/utils/authMiddleware.js
import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // e.g. { email, name, role }
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
