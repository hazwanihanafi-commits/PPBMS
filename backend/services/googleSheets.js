// backend/services/googleSheets.js
import { google } from "googleapis";

/** internal auth helper */
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
    ],
  });
}

/** read full MasterTracking sheet into array of objects */
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

  const header = rows[0].map(h => (h || "").toString());
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = r[i] || ""));
    return obj;
  });
}

/** generic single-cell writer */
export async function writeToSheet(sheetId, sheetName, rowNumber, columnName, value) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ1`
  });

  const headers = headerRes.data.values[0];
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) throw new Error("Column not found: " + columnName);

  // convert 0-based index to A..Z..AA
  function toColLetter(idx) {
    let s = "";
    while (idx >= 0) {
      s = String.fromCharCode((idx % 26) + 65) + s;
      idx = Math.floor(idx / 26) - 1;
    }
    return s;
  }
  const colLetter = toColLetter(colIndex);

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${colLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] }
  });
  return true;
}

/**
 * writeStudentActual
 * - sheetId: spreadsheet id (MasterTracking)
 * - rowNumber: sheet row number to write (1-indexed), but our usage tends to find row for student
 * - actualColumnName, urlColumnName: e.g. "Thesis Draft Completed - Actual" and "Thesis Draft Completed - FileURL"
 */
export async function writeStudentActual(sheetId, rowNumber, actualColumnName, urlColumnName, actualDate, url) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `MasterTracking!A1:ZZ1`
  });
  const headers = headerRes.data.values[0];

  const actualIdx = headers.indexOf(actualColumnName);
  const urlIdx = headers.indexOf(urlColumnName);

  if (actualIdx === -1) throw new Error("Column not found: " + actualColumnName);
  if (urlIdx === -1) throw new Error("Column not found: " + urlColumnName);

  function toColLetter(idx) {
    let s = "";
    while (idx >= 0) {
      s = String.fromCharCode((idx % 26) + 65) + s;
      idx = Math.floor(idx / 26) - 1;
    }
    return s;
  }

  const updates = [];
  if (actualDate !== undefined) {
    updates.push({
      range: `MasterTracking!${toColLetter(actualIdx)}${rowNumber}`,
      values: [[actualDate]]
    });
  }
  if (url !== undefined) {
    updates.push({
      range: `MasterTracking!${toColLetter(urlIdx)}${rowNumber}`,
      values: [[url]]
    });
  }

  // batchUpdate
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { valueInputOption: "USER_ENTERED", data: updates }
  });

  return true;
}
