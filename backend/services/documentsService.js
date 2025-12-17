import { saveFileToStorage } from "./storage.js";
import { appendRow, readSheet } from "./googleSheets.js";

const SHEET_NAME = "DOCUMENTS";

export async function getMyDocuments(studentEmail) {
  const rows = await readSheet(SHEET_NAME);

  return rows
    .filter(r => r.student_email === studentEmail)
    .map(r => ({
      id: r.id,
      section: r.section,
      document_type: r.document_type,
      file_url: r.file_url,
      uploaded_at: r.uploaded_at,
    }));
}

export async function uploadDocument({
  file,
  studentEmail,
  section,
  documentType,
}) {
  const fileUrl = await saveFileToStorage(file);

  const row = {
    id: Date.now().toString(),
    student_email: studentEmail,
    section,
    document_type: documentType,
    file_url: fileUrl,
    uploaded_at: new Date().toISOString(),
  };

  await appendRow(SHEET_NAME, row);

  return row;
}
