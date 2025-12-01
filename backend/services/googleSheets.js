// backend/services/googleSheets.js
import { google } from "googleapis";

// -----------------------------------------------------------
// GOOGLE AUTH
// -----------------------------------------------------------
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

// -----------------------------------------------------------
// READ MASTERTRACKING
// -----------------------------------------------------------
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

  const header = rows[0];

  return rows.slice(1).map(row => {
    const obj = {};
    header.forEach((h, i) => obj[h] = row[i] || "");
    return obj;
  });
}

// -----------------------------------------------------------
// GENERIC WRITE CELL
// -----------------------------------------------------------
export async function writeToSheet(sheetId, sheetName, rowNumber, columnName, value) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // read header
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ1`
  });

  const headers = headerRes.data.values[0];
  const colIndex = headers.indexOf(columnName);

  if (colIndex === -1)
    throw new Error("Column not found: " + columnName);

  // Convert index to Excel column letter
  let n = colIndex;
  let colLetter = "";
  while (n >= 0) {
    colLetter = String.fromCharCode((n % 26) + 65) + colLetter;
    n = Math.floor(n / 26) - 1;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${colLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] }
  });

  return true;
}

// -----------------------------------------------------------
// WRITE STUDENT ACTUAL DATE + FILE URL (MANDATORY UPLOAD)
// -----------------------------------------------------------
export async function writeStudentActual(sheetId, activityKey, fileURL, actualDate) {
  const sheetName = "MasterTracking";

  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // read header row
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ1`
  });

  const headers = headerRes.data.values[0];

  const actualColName = `${activityKey} - Actual`;
  const urlColName = `${activityKey} - FileURL`;

  const actualIndex = headers.indexOf(actualColName);
  const urlIndex = headers.indexOf(urlColName);

  if (actualIndex === -1)
    throw new Error("Missing column: " + actualColName);
  if (urlIndex === -1)
    throw new Error("Missing column: " + urlColName);

  // ALWAYS write into row 2 (each student = separate sheet)
  const rowNumber = 2;

  // convert index to letter
  function colLetter(i) {
    let s = "";
    while (i >= 0) {
      s = String.fromCharCode((i % 26) + 65) + s;
      i = Math.floor(i / 26) - 1;
    }
    return s;
  }

  const actualLetter = colLetter(actualIndex);
  const urlLetter = colLetter(urlIndex);

  // write actual date
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${actualLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[actualDate]] }
  });

  // write file URL
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${urlLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[fileURL]] }
  });

  return true;
}
