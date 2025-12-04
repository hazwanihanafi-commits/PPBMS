// backend/routes/admin.js
import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet, resetSheetCache } from "../utils/sheetCache.js";

const router = express.Router();

/* ============================================================
   ADMIN AUTH MIDDLEWARE
   Validates:
   - JWT Exists
   - JWT is valid
   - role === "admin"
===============================================================*/
function adminOnly(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");

  if (!token)
    return res.status(401).json({ error: "Missing token" });

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);

    if (data.role !== "admin")
      return res.status(401).json({ error: "Admin only" });

    req.user = data;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* ============================================================
   GET ALL STUDENTS (ADMIN ONLY)
===============================================================*/
router.get("/all-students", adminOnly, async (req, res) => {
  try {
    const rows = await getCachedSheet(process.env.SHEET_ID);
    return res.json({ students: rows });
  } catch (err) {
    console.error("ADMIN all-students error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   CLEAR CACHE (ADMIN ONLY)
===============================================================*/
router.post("/reset-cache", adminOnly, (req, res) => {
  resetSheetCache();
  return res.json({ ok: true, message: "Cache cleared" });
});

export default router;
