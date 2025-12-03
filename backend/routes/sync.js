// backend/routes/sync.js
import express from "express";
const router = express.Router();

import db from "../db.js";  // ensure db.js is ESM too

router.post("/upsert", async (req, res) => {
  try {
    const student = req.body.student;

    await db.upsertStudentById(student.student_id, student);

    res.json({ ok: true });
  } catch (err) {
    console.error("Sync error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
