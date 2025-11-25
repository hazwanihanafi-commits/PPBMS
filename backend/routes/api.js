import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { readAllRows } from '../services/sheetsClient.js';
import { runLatenessCheck } from '../jobs/lateness.js';
import { readMasterTracking } from "../services/googleSheets.js";

dotenv.config();
const router = express.Router();

// ----------------- AUTH MIDDLEWARE -----------------
function auth(requiredRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Missing token' });

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      req.user = payload;

      if (requiredRoles.length && !requiredRoles.includes(payload.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      return next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

// =====================================================
// PUBLIC ENDPOINTS
// =====================================================

// ---------- /api/status?matric=XXXX ----------
router.get("/status", async (req, res) => {
  try {
    const matric = (req.query.matric || "").trim();
    if (!matric) return res.status(400).json({ error: "Missing matric" });

    const students = await readMasterTracking(process.env.SHEET_ID);

    const student = students.find(s => String(s.matric).trim() === matric);
    if (!student) return res.status(404).json({ error: "Student not found" });

    return res.json({
      matric: student.matric,
      studentName: student.name,
      P1: student.p1Submitted ? "Submitted" : "",
      P3: student.p3Submitted ? "Submitted" : "",
      P4: student.p4Submitted ? "Submitted" : "",
      P5: student.p5Submitted ? "Submitted" : "",
      overall: student.progress.percentage + "%"
    });
  } catch (err) {
    console.error("STATUS error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ---------- /api/all ----------
router.get("/all", async (req, res) => {
  try {
    const students = await readMasterTracking(process.env.SHEET_ID);

    const total = students.length;
    const completed = students.filter(s => s.p5Approved).length;

    const stages = {
      P1: students.filter(s => s.p1Submitted || s.p1Approved).length,
      P3: students.filter(s => s.p3Submitted || s.p3Approved).length,
      P4: students.filter(s => s.p4Submitted || s.p4Approved).length,
      P5: students.filter(s => s.p5Submitted || s.p5Approved).length,
    };

    const overduration = students.filter(s => s.timeline.status === "Overduration").length;
    const warning = students.filter(s => s.timeline.status === "Warning").length;

    res.json({
      total,
      completed,
      stages,
      overduration,
      warning,
      students
    });
  } catch (err) {
    console.error("API /all error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// =====================================================
// EXISTING PROTECTED ENDPOINTS (NO CHANGE)
// =====================================================

// Admin: list students
router.get('/admin/students', auth(['admin']), async (req,res) => {
  try {
    const rows = await readAllRows(process.env.SHEET_ID, 'MasterTracking!A:ZZ');
    return res.json({rows});
  } catch(e) {
    return res.status(500).json({error:e.message});
  }
});

// Supervisor: list supervised students
router.get('/supervisor/students', auth(['supervisor','admin']), async (req,res) => {
  try {
    const rows = await readAllRows(process.env.SHEET_ID, 'MasterTracking!A:ZZ');
    const my = rows.filter(r => (r.supervisor_email||'').toLowerCase() === req.user.email.toLowerCase());
    return res.json({rows: my});
  } catch(e) {
    return res.status(500).json({error:e.message});
  }
});

// Student: get own row
router.get('/student/me', auth(['student','admin']), async (req,res) => {
  try {
    const rows = await readAllRows(process.env.SHEET_ID, 'MasterTracking!A:ZZ');
    const me = rows.find(r => (r.student_email||'').toLowerCase() === req.user.email.toLowerCase());
    if(!me) return res.status(404).json({error:'Student row not found'});
    return res.json({row: me});
  } catch(e) {
    return res.status(500).json({error:e.message});
  }
});

// System endpoint to trigger lateness job
router.post('/system/run-lateness-check', auth(['admin']), async (req,res) => {
  try {
    await runLatenessCheck();
    return res.json({ok:true});
  } catch(e) {
    return res.status(500).json({error:e.message});
  }
});

export default router;
