import express from "express";
import jwt from "jsonwebtoken";
import { readSUPERVISOR_REMARKS, upsertSUPERVISOR_REMARK } from "../services/googleSheets.js";

const router = express.Router();

/* =========================
   AUTH
========================= */
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

/* =========================
   SAVE / AUTOSAVE REMARK
========================= */
router.post("/remark", auth, async (req, res) => {
  try {
    const { studentMatric, studentEmail, assessmentType, remark } = req.body;

    await upsertSUPERVISOR_REMARK({
      studentMatric,
      studentEmail,
      assessmentType,
      supervisorEmail: req.user.email,
      remark
    });

    return res.json({ success: true });
  } catch (e) {
    console.error("SAVE REMARK ERROR:", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
