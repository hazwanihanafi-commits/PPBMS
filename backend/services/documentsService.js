import crypto from "crypto";
import { readSheet, appendRow, writeSheetCell } from "./googleSheets.js";

const SHEET = "DOCUMENTS";
const SHEET_ID = process.env.SHEET_ID;

export async function saveDocumentLink({
  studentEmail,
  section,
  documentType,
  fileUrl,
}) {
  const rows = await readSheet(SHEET_ID, SHEET);

  // 1️⃣ Supersede existing ACTIVE documents of same type
  rows.forEach((r, idx) => {
    if (
      r.student_email === studentEmail &&
      r.document_type === documentType &&
      r.status === "active"
    ) {
      const rowNumber = idx + 2; // header + 1-indexed
      writeSheetCell(SHEET_ID, "status", rowNumber, "superseded");
    }
  });

  // 2️⃣ Insert NEW active row
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
