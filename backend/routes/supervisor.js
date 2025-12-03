import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

// AUTH
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

/* -------------------------------------------------------
   GET /api/supervisor/students
------------------------------------------------------- */
router.get("/students", auth, async (req, res) => {
  try {
    const spvEmail = (req.user.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const supervised = rows.filter(
      (r) =>
        (r["Main Supervisor's Email"] || "")
          .toLowerCase()
          .trim() === spvEmail
    );

    return res.json({ students: supervised });

  } catch (err) {
    console.error("supervisor/students error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
