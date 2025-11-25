import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { readAllRows } from '../services/sheetsClient.js';
import { runLatenessCheck } from '../jobs/lateness.js';

dotenv.config();
const router = express.Router();

// Middleware to protect endpoints
function auth(requiredRoles=[]) {
  return (req,res,next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ','');
    if (!token) return res.status(401).json({error:'Missing token'});
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      req.user = payload;
      if (requiredRoles.length && !requiredRoles.includes(payload.role)) {
        return res.status(403).json({error:'Forbidden'});
      }
      return next();
    } catch(e) {
      return res.status(401).json({error:'Invalid token'});
    }
  };
}

// Admin: list students
router.get('/admin/students', auth(['admin']), async (req,res) => {
  try {
    const rows = await readAllRows(process.env.SHEET_ID, 'MasterTracking!A:ZZ');
    return res.json({rows});
  } catch(e) {
    console.error(e);
    return res.status(500).json({error:e.message});
  }
});

// Supervisor: list supervised students (auto-filtered)
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

// System endpoint to trigger lateness job (admin)
router.post('/system/run-lateness-check', auth(['admin']), async (req,res) => {
  try {
    await runLatenessCheck();
    return res.json({ok:true});
  } catch(e) {
    return res.status(500).json({error:e.message});
  }
});

export default router;
