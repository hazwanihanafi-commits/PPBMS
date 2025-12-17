import crypto from "crypto";
import { saveFileToStorage } from "./storage.js";
import { readSheet, appendRow, writeSheetCell } from "./googleSheets.js";

const SHEET_NAME = "DOCUMENTS";
const SHEET_ID = process.env.SHEET_ID;

/**
 * Get all active documents for a student
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
 * Get single document (Viewer page)
 */
export async function getDocumentById(documentId) {
  const rows = await readSheet(SHEET_ID, SHEET_NAME);

  const doc = rows.find(
    (r) =>
      r.document_id === documentId &&
      r.status !== "removed"
  );

  if (!doc) return null;

  return {
    document_id: doc.document_id,
    section: doc.section,
    document_type: doc.document_type,
    file_url: doc.file_url,
    version: doc.version,
    status: doc.status,
    uploaded_at: doc.uploaded_at,
    student_email: doc.student_email,
  };
}

/**
 * Upload NEW document (first version)
 */
export async function uploadDocument({
  file,
  studentEmail,
  section,
  documentType,
  uploadedBy = "student",
}) {
  const fileUrl = await saveFileToStorage(file);

  const row = {
    document_id: crypto.randomUUID(),
    student_email: studentEmail,
    section,
    document_type: documentType,
    file_url: fileUrl,
    version: 1,
    status: "active",
    uploaded_by: uploadedBy,
    uploaded_at: new Date().toISOString(),
  };

  await appendRow(SHEET_ID, SHEET_NAME, row);
  return row;
}

/**
 * Replace document (new version)
 */
export async function replaceDocument({
  file,
  studentEmail,
  section,
  documentType,
  uploadedBy = "student",
}) {
  const rows = await readSheet(SHEET_ID, SHEET_NAME);

  const active = rows.find(
    (r) =>
      r.student_email === studentEmail &&
      r.document_type === documentType &&
      r.status === "active"
  );

  let nextVersion = 1;

  // Supersede old version
  if (active) {
    nextVersion = Number(active.version || 1) + 1;
    const rowNumber = rows.indexOf(active) + 2; // header + 1-based
    await writeSheetCell(SHEET_ID, "status", rowNumber, "superseded");
  }

  // Upload new file
  const fileUrl = await saveFileToStorage(file);

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
