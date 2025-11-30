// backend/routes/tasks.js
import express from "express";
import fs from "fs/promises";
import path from "path";
import { authMiddleware, requireSupervisor } from "../utils/authMiddleware.js";
import puppeteer from "puppeteer";

const router = express.Router();

// Simple file storage path (replace with DB in production)
const DB_FILE = path.join(process.cwd(), "backend", "data", "tasks-store.json");

// Ensure data folder & file
async function ensureStore() {
  try {
    await fs.mkdir(path.join(process.cwd(), "backend", "data"), { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify({ students: {} }, null, 2));
    }
  } catch (e) {
    console.error("ensureStore error", e);
  }
}

async function readStore() {
  await ensureStore();
  const txt = await fs.readFile(DB_FILE, "utf8");
  return JSON.parse(txt);
}
async function writeStore(obj) {
  await ensureStore();
  await fs.writeFile(DB_FILE, JSON.stringify(obj, null, 2));
}

/*
  Expected request body for /tick:
  {
    studentEmail: "student@usm.my",
    activityKey: "Thesis Draft Completed",
    tickDate: "2025-11-30"    // optional: server can set if missing
  }
*/
router.post("/tick", authMiddleware, async (req, res) => {
  try {
    const user = req.user; // from auth middleware
    const { studentEmail, activityKey, tickDate } = req.body;
    if (!studentEmail || !activityKey) return res.status(400).json({ error: "Missing studentEmail or activityKey" });

    const store = await readStore();
    store.students[studentEmail] = store.students[studentEmail] || { activities: {}, meta: {} };

    store.students[studentEmail].activities[activityKey] = store.students[studentEmail].activities[activityKey] || {};
    store.students[studentEmail].activities[activityKey].studentTick = true;
    store.students[studentEmail].activities[activityKey].studentTickDate = tickDate || new Date().toISOString().slice(0,10);
    store.students[studentEmail].activities[activityKey].studentTickBy = user.email || user.name || "unknown";

    // change status to pending approval
    store.students[studentEmail].activities[activityKey].approved = false;
    await writeStore(store);

    return res.json({ ok: true, student: store.students[studentEmail] });
  } catch (err) {
    console.error("POST /tasks/tick", err);
    return res.status(500).json({ error: err.message });
  }
});

/*
  Approve:
  { studentEmail, activityKey, approve=true/false }
  Supervisor (auth) only
*/
router.post("/approve", authMiddleware, requireSupervisor, async (req, res) => {
  try {
    const user = req.user;
    const { studentEmail, activityKey, approve } = req.body;
    if (!studentEmail || !activityKey || typeof approve !== "boolean")
      return res.status(400).json({ error: "Missing fields or approve not boolean" });

    const store = await readStore();
    store.students[studentEmail] = store.students[studentEmail] || { activities: {}, meta: {} };
    store.students[studentEmail].activities[activityKey] = store.students[studentEmail].activities[activityKey] || {};

    store.students[studentEmail].activities[activityKey].approved = approve;
    store.students[studentEmail].activities[activityKey].supervisor = user.email || user.name || "supervisor";
    store.students[studentEmail].activities[activityKey].supervisorDate = new Date().toISOString().slice(0,10);

    await writeStore(store);

    return res.json({ ok: true, student: store.students[studentEmail] });
  } catch (err) {
    console.error("POST /tasks/approve", err);
    return res.status(500).json({ error: err.message });
  }
});

/*
  GET /api/tasks/student/:email  — returns student's activity object
*/
router.get("/student/:email", authMiddleware, async (req, res) => {
  try {
    const email = req.params.email;
    const store = await readStore();
    const student = store.students[email] || { activities: {}, meta: {} };
    return res.json({ student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/*
  Export student report as PDF and return to user.
  GET /api/tasks/export/:email/pdf
  Requires auth (student can export their own, supervisor/admin can export any)
*/
router.get("/export/:email/pdf", authMiddleware, async (req, res) => {
  try {
    const targetEmail = req.params.email;
    const requester = req.user;

    // allow student to export only their own or allow supervisor/admin
    if (requester.email !== targetEmail && requester.role !== "supervisor" && requester.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const store = await readStore();
    const data = store.students[targetEmail] || { activities: {}, meta: {} };

    // Build a simple HTML report — style as you need
    const html = `
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Progress report - ${targetEmail}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
          h1 { color: #5E2A84; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Student Progress Report</h1>
        <p><strong>Student:</strong> ${targetEmail}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <table>
          <thead><tr><th>Activity</th><th>Student Tick</th><th>Tick Date</th><th>Approved</th><th>Supervisor</th><th>Supervisor Date</th></tr></thead>
          <tbody>
          ${
            Object.entries(data.activities).map(([act, v]) => {
              return `<tr>
                <td>${act}</td>
                <td>${v.studentTick ? "Yes" : "No"}</td>
                <td>${v.studentTickDate || ""}</td>
                <td>${v.approved ? "Yes" : "No"}</td>
                <td>${v.supervisor || ""}</td>
                <td>${v.supervisorDate || ""}</td>
              </tr>`;
            }).join("")
          }
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Launch puppeteer (ensure you installed it and have enough memory on deploy)
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="progress-${targetEmail}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF export error", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
