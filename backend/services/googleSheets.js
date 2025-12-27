// backend/services/googleSheets.js
import { google } from "googleapis";

/* =========================================================
   AUTH HELPER
========================================================= */
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

/* =========================================================
   GENERIC SHEET READER
========================================================= */
export async function readSheet(sheetId, range) {
  const auth = getAuth(true);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toString().trim());

  return rows.slice(1).map(row =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] || ""]))
  );
}

/* =========================================================
   ASSESSMENT_PLO READ  (UNCHANGED)
========================================================= */
export async function readASSESSMENT_PLO(sheetId) {
  const auth = getAuth(true);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "ASSESSMENT_PLO!A1:ZZ999",
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const headers = rows[0].map(h =>
    h.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")
  );

  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let v = row[i] ?? "";
      if (typeof v === "string") v = v.trim();
      if (h.startsWith("plo")) v = v === "" ? null : Number(v);
      obj[h] = v;
    });

    return {
      matric: obj.matric || "",
      assessment_type: (obj.assessment_type || "").replace(/\s+/g, ""),
      ...obj
    };
  });
}

/* =========================================================
   UPDATE REMARK (ASSESSMENT_PLO)  (UNCHANGED)
========================================================= */
export async function updateASSESSMENT_PLO_Remark({
  studentMatric,
  assessmentType,
  remark
}) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "ASSESSMENT_PLO!A1:ZZ999",
  });

  const rows = res.data.values || [];
  const headers = rows[0].map(h => h.toString().trim().toLowerCase());

  const matricIdx = headers.indexOf("matric");
  const typeIdx = headers.indexOf("assessment_type");
  const remarkIdx = headers.indexOf("remarks");

  const rowIndex = rows.findIndex(
    (r, i) =>
      i > 0 &&
      String(r[matricIdx]).trim() === String(studentMatric).trim() &&
      String(r[typeIdx]).toUpperCase().trim() === assessmentType.toUpperCase()
  );

  if (rowIndex === -1) throw new Error("Assessment row not found");

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: `ASSESSMENT_PLO!${String.fromCharCode(65 + remarkIdx)}${rowIndex + 1}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[remark]] }
  });

  return true;
}

/* =========================================================
   UPDATE ASSESSMENT_PLO CELL (UNCHANGED)
========================================================= */
export async function updateASSESSMENT_PLO_Cell({ rowIndex, column, value }) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "ASSESSMENT_PLO!A1:ZZ1",
  });

  const headers = headerRes.data.values[0]
    .map(h => h.toString().trim().toLowerCase());

  const colIdx = headers.indexOf(column.toLowerCase());
  if (colIdx === -1) throw new Error(`Column not found: ${column}`);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: `ASSESSMENT_PLO!${String.fromCharCode(65 + colIdx)}${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] }
  });

  return true;
}

/* =========================================================
   FINAL PROGRAMME PLO (UNCHANGED)
========================================================= */
export async function readFINALPROGRAMPLO(sheetId) {
  return await readSheet(sheetId, "FINALPROGRAMPLO!A1:Z");
}

/* =========================================================
   AUTH USERS (FIXED & SINGLE SOURCE OF TRUTH)
========================================================= */
export async function readAuthUsers(sheetId) {
  return await readSheet(sheetId, "AUTH_USERS!A1:Z");
}

export async function updateAuthUserPassword({ sheetId, email, hash }) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "AUTH_USERS!A1:Z"
  });

  const [headers, ...rows] = res.data.values;

  const emailCol = headers.indexOf("Email");
  const passCol = headers.indexOf("PasswordHash");
  const setCol = headers.indexOf("PasswordSet");

  const rowIndex = rows.findIndex(
    r => (r[emailCol] || "").toLowerCase().trim() === email
  );

  if (rowIndex === -1) throw new Error("User not found in AUTH_USERS");

  const rowNum = rowIndex + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `AUTH_USERS!${String.fromCharCode(65 + passCol)}${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [[hash]] }
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `AUTH_USERS!${String.fromCharCode(65 + setCol)}${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [["TRUE"]] }
  });

  return true;
}

/* =========================================================
   GENERIC WRITE CELL (KEEP – USED BY MASTERTRACKING)
========================================================= */
export async function writeSheetCell(
  sheetId,
  sheetName,
  columnName,
  rowNumber,
  value
) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ1`
  });

  const headers = headerRes.data.values[0]
    .map(h => h.toString().trim().toLowerCase());

  const colIdx = headers.indexOf(columnName.toLowerCase());
  if (colIdx === -1)
    throw new Error(`Column not found: ${columnName} in ${sheetName}`);

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${String.fromCharCode(65 + colIdx)}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] }
  });

  return true;
}
