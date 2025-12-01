// backend/services/googleSheets.js
import { google } from "googleapis";

/* -----------------------------------------------------------
   AUTH HELPER
----------------------------------------------------------- */
function getAuth(readonly = true) {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");

  const credentials = JSON.parse(raw);

  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      readonly
        ? "https://www.googleapis.com/auth/spreadsheets.readonly"
        : "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
}

/* -----------------------------------------------------------
   READ MASTER TRACKING SHEET → returns array of objects
----------------------------------------------------------- */
export async function readMasterTracking(sheetId) {
  const auth = getAuth(true);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ999",
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const header = rows[0];
  return rows.slice(1).map((r) => {
    const o = {};
    header.forEach((h, i) => (o[h] = r[i] || ""));
    return o;
  });
}

/* -----------------------------------------------------------
   BASIC WRITE FUNCTION (updates a single cell)
----------------------------------------------------------- */
export async function writeToSheet(sheetId, sheetName, rowNumber, columnName, value) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // Read sheet header
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ1`,
  });

  const headers = headerRes.data.values[0];
  const index = headers.indexOf(columnName);

  if (index === -1) throw new Error(`Column not found: ${columnName}`);

  const colLetter = String.fromCharCode(65 + index);

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${colLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });
}

/* -----------------------------------------------------------
   WRITE ACTUAL DATE + FILE URL FOR AN ACTIVITY
----------------------------------------------------------- */
export async function writeStudentActual(sheetId, activityName, fileURL, actualDate) {
  const SHEET_NAME = "MasterTracking";

  // 1) Authenticate
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // 2) Read header to locate columns
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A1:ZZ1`,
  });

  const headers = headerRes.data.values[0];

  const actualColName = `${activityName} - Actual`;
  const fileColName = `${activityName} - FileURL`;

  const actualIndex = headers.indexOf(actualColName);
  const fileIndex = headers.indexOf(fileColName);

  if (actualIndex === -1)
    throw new Error(`Column not found: ${actualColName}`);
  if (fileIndex === -1)
    throw new Error(`Column not found: ${fileColName}`);

  // Always writing to row 2 (each student has its own sheet)
  const rowNumber = 2;

  // Convert index → letter
  const toCol = (i) => String.fromCharCode(65 + i);

  const actualLetter = toCol(actualIndex);
  const fileLetter = toCol(fileIndex);

  // 3) Write Actual date
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!${actualLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[actualDate]] },
  });

  // 4) Write File URL
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!${fileLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[fileURL]] },
  });

  return true;
}
