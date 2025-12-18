// backend/services/masterTracking.js
import { google } from "googleapis";

/* ============================================================
   AUTH HELPER
============================================================ */
function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON env var");
  }

  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch (e) {
    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON format");
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

/* ============================================================
   READ MASTER TRACKING
============================================================ */
export async function readMasterTracking(sheetId) {
  const auth = getAuth();
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ999",
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const headers = rows[0];

  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || "";
    });
    return obj;
  });
}

/* ============================================================
   UPDATE ANY CELL BY COLUMN NAME
============================================================ */
export async function writeSheetCell(sheetId, columnName, rowNumber, value) {
  const auth = getAuth();
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ1",
  });

  const headers = headerRes.data.values[0];
  const colIndex = headers.indexOf(columnName);

  if (colIndex === -1) {
    throw new Error(`Column not found: ${columnName}`);
  }

  const colLetter = indexToColumn(colIndex);

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `MasterTracking!${colLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[value]],
    },
  });

  return true;
}

/* ============================================================
   UPDATE CHECKLIST / DOCUMENT LINK (🔥 FIXES YOUR ERROR)
============================================================ */
export async function updateChecklistCell({
  sheetId,
  studentEmail,
  columnName,
  value,
}) {
  const auth = getAuth();
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ999",
  });

  const rows = res.data.values || [];
  if (rows.length < 2) {
    throw new Error("MasterTracking has no data");
  }

  const headers = rows[0];
  const emailCol = headers.indexOf("Student's Email");
  const targetCol = headers.indexOf(columnName);

  if (emailCol === -1) {
    throw new Error("Column 'Student's Email' not found");
  }

  if (targetCol === -1) {
    throw new Error(`Column '${columnName}' not found`);
  }

  const rowIndex = rows.findIndex(
    (r, i) =>
      i > 0 &&
      (r[emailCol] || "").toLowerCase().trim() ===
        studentEmail.toLowerCase().trim()
  );

  if (rowIndex === -1) {
    throw new Error("Student not found in MasterTracking");
  }

  const rowNumber = rowIndex + 1; // Google Sheets is 1-based
  const colLetter = indexToColumn(targetCol);

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `MasterTracking!${colLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[value]],
    },
  });

  return true;
}

/* ============================================================
   UTIL: COLUMN INDEX → LETTER (A, B, AA…)
============================================================ */
function indexToColumn(index) {
  let column = "";
  let temp = index + 1;

  while (temp > 0) {
    let remainder = (temp - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    temp = Math.floor((temp - 1) / 26);
  }

  return column;
}
