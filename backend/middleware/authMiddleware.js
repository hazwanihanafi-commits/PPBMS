export default function authMiddleware(requiredRole) {
  return (req, res, next) => {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No token" });
    }

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);

      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({ error: "ACCESS_DENIED" });
      }

      req.user = user;
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}
