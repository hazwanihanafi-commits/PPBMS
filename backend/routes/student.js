import express from "express";
import jwt from "jsonwebtoken";
import { readAllRows } from "../services/sheetsClient.js";

const router = express.Router();

function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

router.get("/me", auth, async (req, res) => {
  const rows = await readAllRows(process.env.SHEET_ID, "MasterTracking!A1:ZZ");

  const found = rows.find((s) => {
    const email = (s["Student's Email"] || "").trim().toLowerCase();
    return email === req.user.email.toLowerCase();
  });

  if (!found) return res.status(404).json({ error: "Student not found" });

  res.json({
    row: {
      student_name: found["Student Name"],
      programme: found["Programme"],
      main_supervisor: found["Main Supervisor's Email"],
      student_email: found["Student's Email"],
      raw: found, // optional for debugging
    },
  });
});

export default router;
