import crypto from "crypto";
import { readSheet, appendRow } from "./googleSheets.js";

const SHEET_ID = process.env.SHEET_ID;
const SHEET_NAME = "DOCUMENTS";

/**
 * Get documents for student
 */
export async function getMyDocuments(email) {
  const rows = await readSheet(SHEET_ID, SHEET_NAME);

  return rows
    .filter(
      r =>
        r.student_email === email &&
        r.status !== "removed"
    )
    .map(r => ({
      document_type: r.document_type,
      section: r.section,
      file_url: r.file_url,
      uploaded_at: r.uploaded_at,
    }));
}

/**
 * Save pasted link
 */
export async function saveLink({
  studentEmail,
  documentType,
  section,
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

  await appendRow(SHEET_ID, SHEET_NAME, row);
  return row;
}
