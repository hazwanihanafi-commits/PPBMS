import { saveFileToStorage } from "./storage.js";
import { readSheet, appendRow } from "./googleSheets.js";

const SHEET_NAME = "DOCUMENTS";
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function getMyDocuments(studentEmail) {
  const rows = await readSheet(SPREADSHEET_ID, SHEET_NAME);

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
  // 1️⃣ Upload to Google Drive
  const fileUrl = await saveFileToStorage(file);

  // 2️⃣ Append metadata to DOCUMENTS sheet
  const row = {
    id: Date.now().toString(),
    student_email: studentEmail,
    section,
    document_type: documentType,
    file_url: fileUrl,
    uploaded_at: new Date().toISOString(),
  };

  await appendRow(SPREADSHEET_ID, SHEET_NAME, row);

  return row;
}
