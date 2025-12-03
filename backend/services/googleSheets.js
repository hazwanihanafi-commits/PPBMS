// backend/services/googleSheets.js
import { google } from "googleapis";

/* --------------------------------------------
   AUTH HELPER
---------------------------------------------*/
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

/* --------------------------------------------
   READ MASTER TRACKING
---------------------------------------------*/
export async function readMasterTracking(sheetId) {
  const auth = getAuth(true);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ999"
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const headers = rows[0];
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = r[i] || ""));
    return obj;
  });
}

/* --------------------------------------------
   COLUMN → LETTER (A, B, C, … AA)
---------------------------------------------*/
function colLetter(idx) {
  let s = "";
  while (idx >= 0) {
    s = String.fromCharCode((idx % 26) + 65) + s;
    idx = Math.floor(idx / 26) - 1;
  }
  return s;
}

/* --------------------------------------------
   WRITE ACTUAL + FILEURL
---------------------------------------------*/
export async function writeStudentActual(
  sheetId,
  rowNumber,
  actualColumnName,
  urlColumnName,
  dateValue,
  fileURL
) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ1"
  });

  const headers = headerRes.data.values[0];

  const actualIdx = headers.indexOf(actualColumnName);
  const urlIdx = urlColumnName ? headers.indexOf(urlColumnName) : -1;

  if (actualIdx === -1) throw new Error("Column not found: " + actualColumnName);

  const data = [];

  if (dateValue !== undefined && dateValue !== null) {
    data.push({
      range: `MasterTracking!${colLetter(actualIdx)}${rowNumber}`,
      values: [[dateValue]]
    });
  }

  if (urlColumnName && fileURL !== undefined && fileURL !== null) {
    if (urlIdx === -1)
      throw new Error("Column not found: " + urlColumnName);

    data.push({
      range: `MasterTracking!${colLetter(urlIdx)}${rowNumber}`,
      values: [[fileURL]]
    });
  }

  if (data.length === 0) return true;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { valueInputOption: "USER_ENTERED", data }
  });

  return true;
}

/* --------------------------------------------
   DEPRECATED PLACEHOLDER
---------------------------------------------*/
export function writeToSheet() {
  throw new Error("writeToSheet is deprecated. Use writeStudentActual.");
}
