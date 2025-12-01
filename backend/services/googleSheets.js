// backend/services/googleSheets.js
import { google } from "googleapis";

/* ------------------------------
   AUTH HELPER
------------------------------ */
function getAuth(readonly = true) {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");

  const credentials = JSON.parse(raw);

  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      readonly
        ? "https://www.googleapis.com/auth/spreadsheets.readonly"
        : "https://www.googleapis.com/auth/spreadsheets"
    ]
  });
}

/* ------------------------------
   READ ANY SHEET (row → object)
------------------------------ */
export async function readSheet(sheetId, sheetName = "MasterTracking") {
  const auth = getAuth(true);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ999`
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const header = rows[0];
  return rows.slice(1).map((row) => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = row[i] || ""));
    return obj;
  });
}

/* ------------------------------
   WRITE TO ANY CELL
------------------------------ */
export async function writeToSheet(sheetId, sheetName, rowNumber, columnName, value) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // 1. Find column index
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ1`
  });

  const headers = headerRes.data.values[0];
  const colIndex = headers.indexOf(columnName);

  if (colIndex === -1) throw new Error("Column not found: " + columnName);

  // Convert index to column letter (A,B,... AA, AB)
  function toColumnLetter(idx) {
    let letter = "";
    while (idx >= 0) {
      letter = String.fromCharCode((idx % 26) + 65) + letter;
      idx = Math.floor(idx / 26) - 1;
    }
    return letter;
  }

  const colLetter = toColumnLetter(colIndex);

  // 2. Write value
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${colLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] }
  });

  return true;
}

/* -------------------------------------------------------
   WRITE STUDENT ACTUAL DATE + FILE URL
   (used when student uploads mandatory documents)
------------------------------------------------------- */
export async function writeStudentActual(sheetId, activityKey, url, actualDate) {
  const sheetName = "MasterTracking";
  const rowNumber = 2;  // always row 2 in the per-student sheet

  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // Load all headers
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ1`
  });

  const headers = headerRes.data.values[0];

  const actualColumn = `${activityKey} - Actual`;
  const urlColumn = `${activityKey} - FileURL`;

  const actualIndex = headers.indexOf(actualColumn);
  const urlIndex = headers.indexOf(urlColumn);

  if (actualIndex === -1)
    throw new Error("Column not found: " + actualColumn);

  if (urlIndex === -1)
    throw new Error("Column not found: " + urlColumn);

  // Convert index to letter
  function toColumnLetter(idx) {
    let letter = "";
    while (idx >= 0) {
      letter = String.fromCharCode((idx % 26) + 65) + letter;
      idx = Math.floor(idx / 26) - 1;
    }
    return letter;
  }

  const actualLetter = toColumnLetter(actualIndex);
  const urlLetter = toColumnLetter(urlIndex);

  // Update actual date
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${actualLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[actualDate]] }
  });

  // Update file URL
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${urlLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[url]] }
  });

  return true;
}

/* ------------------------------
   EXPORTS
------------------------------ */
export default {
  readSheet,
  writeToSheet,
  writeStudentActual
};
