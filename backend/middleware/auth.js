export function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    req.user = decoded; // must include matric
    next();

  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
