// backend/routes/supervisor.js
import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet } from "../utils/sheetCache.js";

const router = express.Router();

/* --------------------------------------------
   AUTH
---------------------------------------------*/
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* --------------------------------------------
   SUPERVISOR: LIST STUDENTS
---------------------------------------------*/
router.get("/students", auth, async (req, res) => {
  try {
    const email = req.user.email?.toLowerCase().trim();
    const rows = await getCachedSheet(process.env.SHEET_ID);

    const assigned = rows.filter(
      (r) =>
        (r["Main Supervisor's Email"] || "")
          .toLowerCase()
          .trim() === email
    );

    return res.json({ students: assigned });
  } catch (err) {
    console.error("SUPERVISOR /students ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
