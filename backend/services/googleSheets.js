// backend/services/googleSheets.js
import { google } from "googleapis";

function getAuth(readonly = true) {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      readonly ? "https://www.googleapis.com/auth/spreadsheets.readonly" : "https://www.googleapis.com/auth/spreadsheets"
    ]
  });
}

export async function readMasterTracking(sheetId) {
  const auth = getAuth(true);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ999",
  });
  const rows = res.data.values || [];
  if (!rows.length) return [];
  const header = rows[0].map(h => (h || "").toString());
  return rows.slice(1).map(r => {
    const obj = {};
    header.forEach((h, i) => obj[h] = r[i] || "");
    return obj;
  });
}

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
  const colLetter = String.fromCharCode(65 + colIndex);
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${colLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] }
  });
  return true;
}
// -----------------------------------------------------------
// WRITE ACTUAL DATE + FILE URL for a student activity
// -----------------------------------------------------------
export async function writeStudentActual(sheetId, activityKey, url, actualDate) {
  const sheetName = "MasterTracking";

  // authenticate
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // 1️⃣ Read header row to find correct columns
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
    throw new Error(`Column not found: ${actualColumn}`);
  if (urlIndex === -1)
    throw new Error(`Column not found: ${urlColumn}`);

  // 2️⃣ Find the row number for the student’s sheet
  const studentSheet = sheetId; // activity sheet = student sheet
  const rowNumber = 2; // always row 2 for student sheet

  // Convert index to Excel column letter
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

  // 3️⃣ Write Actual Date
  await sheets.spreadsheets.values.update({
    spreadsheetId: studentSheet,
    range: `${sheetName}!${actualLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[actualDate]] }
  });

  // 4️⃣ Write File URL
  await sheets.spreadsheets.values.update({
    spreadsheetId: studentSheet,
    range: `${sheetName}!${urlLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[url]] }
  });

  return true;
}
