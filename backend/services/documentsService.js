import crypto from "crypto";
import { readSheet, appendRow, writeSheetCell } from "./googleSheets.js";

const SHEET = "DOCUMENTS";
const SHEET_ID = process.env.SHEET_ID;

/**
 * ✅ Get documents for logged-in student
 */
export async function getMyDocuments(studentEmail) {
  const rows = await readSheet(SHEET_ID, SHEET);

  return rows.filter(
    r => r.student_email === studentEmail && r.status === "active"
  );
}

/**
 * ✅ Get documents for supervisor (by student email)
 */
export async function getDocumentsByStudent(studentEmail) {
  const rows = await readSheet(SHEET_ID, SHEET);

  return rows.filter(
    r => r.student_email === studentEmail && r.status === "active"
  );
}

/**
 * ✅ Save pasted document link (NO Google Drive upload)
 */
export async function saveLink({
  studentEmail,
  section,
  documentType,
  fileUrl,
}) {
  const row = {
    document_id: crypto.randomUUID(),
    student_email: studentEmail,
    section,
    document_type: documentType,
    file_url: fileUrl,
    status: "active",
    uploaded_at: new Date().toISOString(),
  };

  await appendRow(SHEET_ID, SHEET, row);
  return row;
}
