import { saveFileToStorage } from "./storage.js";
import { readSheet, appendRow } from "./googleSheets.js";

const SHEET_NAME = "DOCUMENTS";
const SPREADSHEET_ID = process.env.SHEET_ID;

/**
 * Get documents for logged-in student
 */
export async function getMyDocuments(studentEmail) {
  const rows = await readSheet(SPREADSHEET_ID, SHEET_NAME);

  return rows
    .filter((r) => r.student_email === studentEmail && r.status !== "removed")
    .map((r) => ({
      document_id: r.document_id, // ✅ CONSISTENT
      section: r.section,
      document_type: r.document_type,
      file_url: r.file_url,
      uploaded_at: r.uploaded_at,
    }));
}

/**
 * Get single document (for Viewer page)
 */
export async function getDocumentById(documentId) {
  const rows = await readSheet(SPREADSHEET_ID, SHEET_NAME);

  const doc = rows.find(
    (r) => r.document_id === documentId && r.status !== "removed"
  );

  if (!doc) return null;

  return {
    document_id: doc.document_id,
    section: doc.section,
    document_type: doc.document_type,
    file_url: doc.file_url,
    uploaded_at: doc.uploaded_at,
    student_email: doc.student_email,
  };
}

/**
 * Upload (or replace) document
 */
export async function uploadDocument({
  file,
  studentEmail,
  section,
  documentType,
}) {
  // 1️⃣ Upload to Google Drive
  const fileUrl = await saveFileToStorage(file);

  // 2️⃣ Prepare metadata row
  const row = {
    document_id: crypto.randomUUID(), // ✅ STRONG ID
    student_email: studentEmail,
    section,
    document_type: documentType,
    file_url: fileUrl,
    status: "active",
    uploaded_at: new Date().toISOString(),
  };

  // 3️⃣ Save to DOCUMENTS sheet
  await appendRow(SPREADSHEET_ID, SHEET_NAME, row);

  return row;
}
