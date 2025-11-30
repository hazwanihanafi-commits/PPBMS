// backend/routes/tasks.js
import express from "express";
import {
  getStudentEntry,
  setTick,
  clearTick,
  setSupervisorApproval,
  setStudentMeta,
  listStudents,
} from "../services/tasksStore.js";

import { verifyJWT } from "../utils/authMiddleware.js"; // small helper below

const router = express.Router();

// GET student task status (public for now but needs auth)
router.get("/student/:email", verifyJWT, async (req, res) => {
  const { email } = req.params;
  try {
    const entry = await getStudentEntry(email);
    return res.json({ student: entry });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Student ticks an item
router.post("/tick", verifyJWT, async (req, res) => {
  // body: { studentEmail, key, docUrl? }
  const { studentEmail, key, docUrl } = req.body;
  const actorEmail = req.user.email;
  if (!studentEmail || !key) return res.status(400).json({ error: "Missing studentEmail or key" });

  // ensure only the student (or admin) may tick for that student
  if (actorEmail !== studentEmail && req.user.role !== "admin") {
    return res.status(403).json({ error: "Not allowed to tick for other student" });
  }

  try {
    const tick = await setTick(studentEmail, key, actorEmail, new Date().toISOString(), docUrl || "");
    return res.json({ tick });
  } catch (err) {
    console.error("tick error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Student/ admin can clear tick
router.post("/clear", verifyJWT, async (req, res) => {
  const { studentEmail, key } = req.body;
  const actorEmail = req.user.email;
  if (!studentEmail || !key) return res.status(400).json({ error: "Missing studentEmail or key" });
  if (actorEmail !== studentEmail && req.user.role !== "admin") {
    return res.status(403).json({ error: "Not allowed" });
  }
  try {
    const tick = await clearTick(studentEmail, key);
    return res.json({ tick });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Supervisor approves a tick
router.post("/approve", verifyJWT, async (req, res) => {
  // body: { studentEmail, key, approve: true }
  const { studentEmail, key, approve = true } = req.body;
  if (!studentEmail || !key) return res.status(400).json({ error: "Missing studentEmail or key" });

  if (req.user.role !== "supervisor" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Only supervisors can approve" });
  }

  try {
    const tick = await setSupervisorApproval(studentEmail, key, req.user.email, !!approve);
    return res.json({ tick });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: set student meta (name, programme, start_date) - optional
router.post("/meta", verifyJWT, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "supervisor") {
    return res.status(403).json({ error: "Not allowed" });
  }
  const { studentEmail, meta } = req.body;
  if (!studentEmail || !meta) return res.status(400).json({ error: "Missing studentEmail or meta" });
  try {
    const student = await setStudentMeta(studentEmail, meta);
    return res.json({ student });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// List all students (for supervisor dashboard)
router.get("/list", verifyJWT, async (req, res) => {
  try {
    const store = await listStudents();
    return res.json({ students: store });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
