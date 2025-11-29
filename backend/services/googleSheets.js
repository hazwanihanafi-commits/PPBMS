// backend/services/googleSheets.js
import { google } from "googleapis";

/**
 * AUTH HELPER
 */
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

/**
 * READ MASTER TRACKING SHEET
 */
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

  return rows.slice(1).map((row) => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = row[i] || ""));
    return obj;
  });
}

/**
 * WRITE TO GOOGLE SHEET (Update 1 cell)
 */
export async function writeToSheet(sheetId, sheetName, rowNumber, columnName, value) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // get header row to find column index
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ1`,
  });

  const headers = headerRes.data.values[0];
  const colIndex = headers.indexOf(columnName);

  if (colIndex === -1) throw new Error("Column not found: " + columnName);

  const colLetter = String.fromCharCode(65 + colIndex); // A,B,C...

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${colLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });

  return true;
}
