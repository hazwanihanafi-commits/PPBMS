// backend/routes/admin.js
import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet, resetSheetCache } from "../utils/sheetCache.js";

const router = express.Router();

/* --------------------------------------------
   ADMIN AUTH CHECK
---------------------------------------------*/
function admin(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    if (data.role !== "admin") throw new Error();
    req.user = data;
    next();
  } catch {
    return res.status(401).json({ error: "Admin only" });
  }
}

/* --------------------------------------------
   GET ALL STUDENTS
---------------------------------------------*/
router.get("/all-students", admin, async (req, res) => {
  try {
    const rows = await getCachedSheet(process.env.SHEET_ID);
    return res.json({ students: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* --------------------------------------------
   CLEAR CACHE (FOR DEBUG)
---------------------------------------------*/
router.post("/reset-cache", admin, (req, res) => {
  resetSheetCache();
  return res.json({ ok: true });
});

export default router;
