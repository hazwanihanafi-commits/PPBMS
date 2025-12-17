import crypto from "crypto";
import { saveFileToStorage } from "./storage.js";
import { readSheet, appendRow, writeSheetCell } from "./googleSheets.js";

const SHEET = "DOCUMENTS";
const SHEET_ID = process.env.SHEET_ID;

export async function replaceDocument({
  file,
  studentEmail,
  section,
  documentType,
  uploadedBy = "student",
}) {
  const rows = await readSheet(SHEET_ID, SHEET);

  const active = rows.find(
    r =>
      r.student_email === studentEmail &&
      r.document_type === documentType &&
      r.status === "active"
  );

  let nextVersion = 1;

  // 1️⃣ Supersede old version
  if (active) {
    nextVersion = Number(active.version || 1) + 1;

    const rowNumber = rows.indexOf(active) + 2; // +2 for header + 1-based
    await writeSheetCell(SHEET_ID, "status", rowNumber, "superseded");
  }

  // 2️⃣ Upload new file
  const fileUrl = await saveFileToStorage(file);

  // 3️⃣ Append new version
  const row = {
    document_id: crypto.randomUUID(),
    student_email: studentEmail,
    section,
    document_type: documentType,
    file_url: fileUrl,
    version: nextVersion,
    status: "active",
    uploaded_by: uploadedBy,
    uploaded_at: new Date().toISOString(),
  };

  await appendRow(SHEET_ID, SHEET, row);
  return row;
}
