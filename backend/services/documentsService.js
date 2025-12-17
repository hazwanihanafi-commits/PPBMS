import crypto from "crypto";
import { readSheet, appendRow, writeSheetCell } from "./googleSheets.js";

const SHEET_NAME = "DOCUMENTS";
const SHEET_ID = process.env.SHEET_ID;

/**
 * Get all documents for logged-in student
 */
export async function getMyDocuments(studentEmail) {
  const rows = await readSheet(SHEET_ID, SHEET_NAME);

  return rows
    .filter(
      (r) =>
        r.student_email === studentEmail &&
        r.status !== "removed"
    )
    .map((r) => ({
      document_id: r.document_id,
      section: r.section,
      document_type: r.document_type,
      file_url: r.file_url,
      version: r.version,
      status: r.status,
      uploaded_at: r.uploaded_at,
    }));
}

/**
 * Save (or replace) document link
 */
export async function saveDocumentLink({
  studentEmail,
  section,
  documentType,
  fileUrl,
  uploadedBy = "student",
}) {
  const rows = await readSheet(SHEET_ID, SHEET_NAME);

  // find active version
  const active = rows.find(
    (r) =>
      r.student_email === studentEmail &&
      r.document_type === documentType &&
      r.status === "active"
  );

  let nextVersion = 1;

  // supersede old
  if (active) {
    nextVersion = Number(active.version || 1) + 1;
    const rowNumber = rows.indexOf(active) + 2;
    await writeSheetCell(SHEET_ID, "status", rowNumber, "superseded");
  }

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

  await appendRow(SHEET_ID, SHEET_NAME, row);
  return row;
}

/**
 * Remove document (soft delete)
 */
export async function removeDocument(documentId) {
  const rows = await readSheet(SHEET_ID, SHEET_NAME);
  const doc = rows.find((r) => r.document_id === documentId);

  if (!doc) throw new Error("Document not found");

  const rowNumber = rows.indexOf(doc) + 2;
  await writeSheetCell(SHEET_ID, "status", rowNumber, "removed");

  return true;
}
