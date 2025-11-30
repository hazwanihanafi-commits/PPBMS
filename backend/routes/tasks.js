// backend/routes/tasks.js
import express from "express";
import formidable from "formidable";
import fs from "fs";
import { google } from "googleapis";
import sendgrid from "@sendgrid/mail";
import { readMasterTracking, writeToSheet } from "../services/googleSheets.js";
import auth from "../utils/authMiddleware.js"; // your middleware that sets req.user

const router = express.Router();
sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

const SHEET_ID = process.env.SHEET_ID;
const SHEET_NAME = "MasterTracking";

// Helper: find the row number (1-indexed) for a student email (returns sheet row number)
async function findRowNumberByEmail(email) {
  const rows = await readMasterTracking(SHEET_ID);
  const idx = rows.findIndex(r => (r["Student's Email"] || "").toLowerCase().trim() === (email || "").toLowerCase().trim());
  if (idx === -1) return null;
  // data rows start on row 2 in sheet (A1 is header), so sheetRow = idx + 2
  return idx + 2;
}

// Helper: update sheet cell and optionally notify
async function updateSheetCell(rowNumber, columnName, value) {
  await writeToSheet(SHEET_ID, SHEET_NAME, rowNumber, columnName, value);
}

/*
POST /api/tasks/toggle
body: { studentEmail, key, actor } 
actor: 'student' or 'supervisor'
If actor === 'student' we set "<key>" to "TRUE" and set "<key> StudentTickDate" to today and set "<key> SupervisorApproved" to FALSE (or leave existing)
If actor === 'supervisor' we set "<key> SupervisorApproved" to TRUE and "<key> SupervisorApproveDate"
*/
router.post("/toggle", auth, async (req, res) => {
  try {
    const { studentEmail, key, actor } = req.body;
    if (!studentEmail || !key || !actor) return res.status(400).json({ error: "Missing fields" });

    const rowNumber = await findRowNumberByEmail(studentEmail);
    if (!rowNumber) return res.status(404).json({ error: "Student not found" });

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    if (actor === "student") {
      // set the main tick + date
      await updateSheetCell(rowNumber, key, "TRUE");
      await updateSheetCell(rowNumber, `${key} StudentTickDate`, today);
      // set supervisor approve to FALSE to require endorsement
      await updateSheetCell(rowNumber, `${key} SupervisorApproved`, "FALSE");
      await updateSheetCell(rowNumber, `${key} SupervisorApproveDate`, "");
      // notify supervisor (async)
      try {
        const rows = await readMasterTracking(SHEET_ID);
        const rowData = rows[rowNumber - 2];
        const supervisorEmail = rowData["Main Supervisor's Email"] || rowData["Main Supervisor"];
        if (supervisorEmail) {
          await sendgrid.send({
            to: supervisorEmail,
            from: process.env.NOTIFY_FROM_EMAIL,
            subject: `PPBMS: ${rowData["Student Name"]} ticked "${key}"`,
            text: `${rowData["Student Name"]} ticked "${key}". Please review and approve in the Supervisor dashboard.`
          });
        }
      } catch (e) {
        console.warn("notify error:", e?.message || e);
      }
      return res.json({ ok: true, message: "Student tick recorded" });

    } else if (actor === "supervisor") {
      // only supervisors allowed to approve — auth middleware should ensure req.user.role === 'supervisor'
      await updateSheetCell(rowNumber, `${key} SupervisorApproved`, "TRUE");
      await updateSheetCell(rowNumber, `${key} SupervisorApproveDate`, today);

      // Optionally, set a "Status P" or recalc field here (you can add a formula on sheet)
      // notify student that approved
      try {
        const rows = await readMasterTracking(SHEET_ID);
        const rowData = rows[rowNumber - 2];
        const studentEmailRow = rowData["Student's Email"];
        if (studentEmailRow) {
          await sendgrid.send({
            to: studentEmailRow,
            from: process.env.NOTIFY_FROM_EMAIL,
            subject: `PPBMS: Supervisor approved "${key}"`,
            text: `Your supervisor approved "${key}". Check your dashboard for details.`
          });
        }
      } catch (e) {
        console.warn("notify error:", e?.message || e);
      }

      return res.json({ ok: true, message: "Supervisor approval recorded" });
    } else {
      return res.status(400).json({ error: "actor must be 'student' or 'supervisor'" });
    }
  } catch (err) {
    console.error("toggle error:", err);
    return res.status(500).json({ error: err.message });
  }
});


/*
POST /api/tasks/upload
multipart/form-data: file, studentEmail, key
Uploads file to Google Drive with service account, gets URL, writes URL to sheet under "<key> Submission URL" (or given column)
*/
router.post("/upload", auth, async (req, res) => {
  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(400).json({ error: "invalid form" });
      const { studentEmail, key } = fields;
      if (!studentEmail || !key) return res.status(400).json({ error: "Missing studentEmail or key" });
      const file = files.file;
      if (!file) return res.status(400).json({ error: "Missing file" });

      // Upload to Google Drive (service account)
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const authClient = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"]
      });
      const client = await authClient.getClient();
      const drive = google.drive({ version: "v3", auth: client });

      const fileStream = fs.createReadStream(file.filepath || file.path);

      const driveRes = await drive.files.create({
        requestBody: {
          name: file.originalFilename || file.newFilename || `upload_${Date.now()}`,
          parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : undefined
        },
        media: {
          mimeType: file.mimetype,
          body: fileStream
        },
        fields: "id, webViewLink, webContentLink"
      });

      const fileId = driveRes.data.id;
      // make file readable (optional) - with service account you may need to set permissions:
      try {
        await drive.permissions.create({
          fileId,
          requestBody: {
            role: "reader",
            type: "anyone"
          }
        });
      } catch (e) {
        console.warn("permission set failed:", e?.message || e);
      }

      // webViewLink sometimes returns - build a common public link
      const url = `https://drive.google.com/file/d/${fileId}/view`;

      // write URL into sheet
      const rowNumber = await findRowNumberByEmail(studentEmail);
      if (!rowNumber) return res.status(404).json({ error: "Student not found" });

      const columnName = `${key} Submission URL`;
      await updateSheetCell(rowNumber, columnName, url);
      // also set the "Submitted" tick + date
      await updateSheetCell(rowNumber, `${key} Submitted`, "TRUE");
      const today = new Date().toISOString().slice(0, 10);
      await updateSheetCell(rowNumber, `${key} StudentTickDate`, today);
      await updateSheetCell(rowNumber, `${key} SupervisorApproved`, "FALSE");

      return res.json({ ok: true, url });
    } catch (e) {
      console.error("upload error:", e);
      return res.status(500).json({ error: e.message });
    }
  });
});


/*
GET /api/tasks/exportPdf/:studentEmail
Generates a PDF snapshot of progress and returns it as application/pdf
(we use pdfkit)
*/
router.get("/exportPdf/:studentEmail", auth, async (req, res) => {
  try {
    const { studentEmail } = req.params;
    const rows = await readMasterTracking(SHEET_ID);
    const rowIndex = rows.findIndex(r => (r["Student's Email"] || "").toLowerCase() === (studentEmail || "").toLowerCase());
    if (rowIndex === -1) return res.status(404).json({ error: "Student not found" });
    const row = rows[rowIndex];

    // create PDF
    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${(row["Student Name"]||'student')}_progress.pdf"`);

    doc.fontSize(18).text(`Student Progress — ${(row["Student Name"] || "")}`, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Programme: ${row["Programme"] || ""}`);
    doc.text(`Supervisor: ${row["Main Supervisor"] || ""}`);
    doc.text(`Start Date: ${row["Start Date"] || ""}`);
    doc.moveDown();

    // list key items — you can decide which columns to include
    const keysToShow = [
      "P1 Submitted","P1 StudentTickDate","P1 Submission URL","P1 SupervisorApproved",
      "P3 Submitted","P3 StudentTickDate","P3 Submission URL","P3 SupervisorApproved",
      "P4 Submitted","P4 StudentTickDate","P4 Submission URL","P4 SupervisorApproved",
      "P5 Submitted","P5 StudentTickDate","P5 Submission URL","P5 SupervisorApproved"
    ];

    keysToShow.forEach(k => {
      doc.fontSize(10).text(`${k}: ${row[k] || "—"}`);
    });

    doc.end();
    doc.pipe(res);

  } catch (err) {
    console.error("export pdf err:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
