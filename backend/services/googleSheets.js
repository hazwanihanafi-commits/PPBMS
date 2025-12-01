// backend/services/googleSheets.js
import { google } from "googleapis";

/** helper */
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

/** READ master sheet rows */
export async function readMasterTracking(sheetId) {
  if (!sheetId) throw new Error("Missing SHEET_ID");
  const auth = getAuth(true);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ999",
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return []; // no data rows

  const header = rows[0].map((h) => (h || "").toString());
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = r[i] || ""));
    return obj;
  });
}

/** GENERAL cell writer */
export async function writeToSheet(sheetId, sheetName, rowNumber, columnName, value) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ1`,
  });
  const headers = headerRes.data.values[0] || [];
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) throw new Error("Column not found: " + columnName);

  // convert 0-based idx -> column letter
  function toColLetter(idx) {
    let s = "";
    while (idx >= 0) {
      s = String.fromCharCode((idx % 26) + 65) + s;
      idx = Math.floor(idx / 26) - 1;
    }
    return s;
  }
  const letter = toColLetter(colIndex);
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${letter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });
  return true;
}

/**
 * Write an actual date and file URL for a student in MASTER sheet
 * - sheetId: spreadsheet id (MasterTracking)
 * - studentRowNumber: the sheet row number to update (1-indexed)
 * - activityKey: e.g. "Thesis Draft Completed" — the header must match
 * - actualDate, fileUrl
 */
export async function writeStudentActualToMaster(sheetId, studentRowNumber, activityKey, actualDate, fileUrl = "") {
  const actualCol = `${activityKey} - Actual`;
  const urlCol = `${activityKey} - FileURL`;

  // write actual date then file url (if present)
  await writeToSheet(sheetId, "MasterTracking", studentRowNumber, actualCol, actualDate || "");
  if (fileUrl) {
    await writeToSheet(sheetId, "MasterTracking", studentRowNumber, urlCol, fileUrl);
  }
  return true;
}
