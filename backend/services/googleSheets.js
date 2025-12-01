// backend/services/googleSheets.js
import { google } from "googleapis";

/* -----------------------------------------------------------
   AUTH
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
   READ MASTER TRACKING (used by supervisor + student/me)
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

  const header = rows[0].map((h) => (h || "").toString());

  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = r[i] || ""));
    return obj;
  });
}

/* -----------------------------------------------------------
   WRITE A SINGLE CELL IN A SHEET
----------------------------------------------------------- */
export async function writeToSheet(sheetId, sheetName, rowNumber, columnName, value) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ1`,
  });

  const headers = headerRes.data.values[0];
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) throw new Error("Column not found: " + columnName);

  // Convert index → Excel column letter
  let idx = colIndex;
  let colLetter = "";
  while (idx >= 0) {
    colLetter = String.fromCharCode((idx % 26) + 65) + colLetter;
    idx = Math.floor(idx / 26) - 1;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${colLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });

  return true;
}

/* -----------------------------------------------------------
   WRITE ACTUAL DATE + FILE URL FOR STUDENT ACTIVITY
----------------------------------------------------------- */
export async function writeStudentActual(sheetId, activityKey, fileUrl, actualDate) {
  const sheetName = "MasterTracking";

  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // 1️⃣ Load headers
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ1`,
  });

  const headers = headerRes.data.values[0];

  const actualCol = `${activityKey} - Actual`;
  const urlCol = `${activityKey} - FileURL`;

  const actualIndex = headers.indexOf(actualCol);
  const urlIndex = headers.indexOf(urlCol);

  if (actualIndex === -1)
    throw new Error(`Column not found: ${actualCol}`);
  if (urlIndex === -1)
    throw new Error(`Column not found: ${urlCol}`);

  // student data always row 2
  const rowNumber = 2;

  // Helper to convert index → column letter
  function toColLetter(idx) {
    let letter = "";
    while (idx >= 0) {
      letter = String.fromCharCode((idx % 26) + 65) + letter;
      idx = Math.floor(idx / 26) - 1;
    }
    return letter;
  }

  const actualLetter = toColLetter(actualIndex);
  const urlLetter = toColLetter(urlIndex);

  // 2️⃣ Write Actual Date
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${actualLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[actualDate]] },
  });

  // 3️⃣ Write URL
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${urlLetter}${rowNumber}`,
    valueInputOption: "USER_ENTRY",
    requestBody: { values: [[fileUrl]] },
  });

  return true;
}
