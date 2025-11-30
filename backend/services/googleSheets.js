// backend/services/googleSheets.js
import { google } from "googleapis";

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

async function getSheetsClient(readonly = true) {
  const auth = getAuth(readonly);
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

// Read header row (A1:ZZ1)
export async function readHeaderRow(sheetId) {
  const sheets = await getSheetsClient(true);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ1",
  });
  const headers = (res.data.values && res.data.values[0]) || [];
  return headers;
}

// Ensure headers exist: will append missing headers to the end of header row
export async function ensureHeaders(sheetId, requiredHeaders = []) {
  const sheets = await getSheetsClient(false);
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ1",
  });
  const existing = (headerRes.data.values && headerRes.data.values[0]) || [];

  const missing = requiredHeaders.filter(h => !existing.includes(h));
  if (missing.length === 0) return { updated: false, missing: [] };

  const newHeader = existing.concat(missing);
  // write back full header row (A1:...)
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `MasterTracking!A1:1`,
    valueInputOption: "RAW",
    requestBody: { values: [newHeader] },
  });

  return { updated: true, missing };
}

// Read the whole MasterTracking sheet (A1:ZZ999)
export async function readMasterTracking(sheetId) {
  const sheets = await getSheetsClient(true);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ999",
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];
  const header = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = row[i] || ""));
    return obj;
  });
}

// Update one cell by header name + row number (rowNumber is 1-indexed)
export async function writeToSheet(sheetId, sheetName, rowNumber, columnName, value) {
  const sheets = await getSheetsClient(false);

  // get header row
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ1`,
  });
  const headers = (headerRes.data.values && headerRes.data.values[0]) || [];
  const colIndex = headers.indexOf(columnName);

  if (colIndex === -1) {
    throw new Error(`Column not found: "${columnName}"`);
  }

  // convert 0-based colIndex to letter(s)
  function colIndexToLetter(index) {
    // supports beyond Z
    let letter = '';
    let n = index + 1;
    while (n > 0) {
      const rem = (n - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      n = Math.floor((n - 1) / 26);
    }
    return letter;
  }

  const colLetter = colIndexToLetter(colIndex);
  const range = `${sheetName}!${colLetter}${rowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });

  return true;
}
