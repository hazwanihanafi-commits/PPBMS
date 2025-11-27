const router = require("express").Router();
const db = require("../db"); // implement your DB upsert

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

module.exports = router;
