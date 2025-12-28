// backend/services/googleSheets.js
import { google } from "googleapis";

/* ================= AUTH ================= */
function getAuth(readonly = true) {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");

  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: readonly
      ? ["https://www.googleapis.com/auth/spreadsheets.readonly"]
      : ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

/* ================= GENERIC READ ================= */
export async function readSheet(sheetId, range) {
  const auth = getAuth(true);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toString().trim());

  return rows.slice(1).map(row =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] || ""]))
  );
}

/* ================= MASTER TRACKING ================= */
export async function readMasterTracking(sheetId) {
  return readSheet(sheetId, "MasterTracking!A1:ZZ999");
}

/* ================= SAFE WRITE (HEADER-BASED) ================= */
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

  // Read headers
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ1`,
  });

  const headers = headerRes.data.values[0].map(h =>
    h.toString().trim().toLowerCase()
  );

  const colIdx = headers.indexOf(columnName.toLowerCase());
  if (colIdx === -1) {
    throw new Error(`Column not found: ${columnName}`);
  }

  // Convert index → column letter
  let colLetter = "";
  let n = colIdx;
  while (n >= 0) {
    colLetter = String.fromCharCode((n % 26) + 65) + colLetter;
    n = Math.floor(n / 26) - 1;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!${colLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });

  return true;
}

/* ================= AUTH USERS (LOGIN) ================= */
export async function readAuthUsers(sheetId) {
  return readSheet(sheetId, "AUTH_USERS!A1:Z");
}

export async function updateAuthUserPassword({ sheetId, email, hash }) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "AUTH_USERS!A1:Z",
  });

  const [headers, ...rows] = res.data.values;
  const norm = h => h.toLowerCase().trim();

  const emailCol = headers.findIndex(h => norm(h) === "email");
  const passCol  = headers.findIndex(h => norm(h) === "passwordhash");
  const setCol   = headers.findIndex(h => norm(h) === "passwordset");

  const idx = rows.findIndex(
    r => (r[emailCol] || "").toLowerCase().trim() === email.toLowerCase()
  );
  if (idx === -1) throw new Error("User not found");

  const rowNum = idx + 2;
  const col = i => String.fromCharCode(65 + i);

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `AUTH_USERS!${col(passCol)}${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [[hash]] },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `AUTH_USERS!${col(setCol)}${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [["TRUE"]] },
  });

  return true;
}

/* =========================================================
   ASSESSMENT_PLO READ (REQUIRED BY SUPERVISOR ROUTES)
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
    (h || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
  );

  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let v = row[i] ?? "";
      if (typeof v === "string") v = v.trim();
      if (h.startsWith("plo")) v = v === "" ? null : Number(v);
      obj[h] = v;
    });
    return obj;
  });
}

/* =========================================================
   UPDATE ASSESSMENT_PLO CELL (REQUIRED)
========================================================= */
export async function updateASSESSMENT_PLO_Cell({
  rowIndex,
  column,
  value,
}) {
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
  if (colIdx === -1)
    throw new Error(`Column not found: ${column}`);

  // convert index → column letter
  let col = "";
  let n = colIdx;
  while (n >= 0) {
    col = String.fromCharCode((n % 26) + 65) + col;
    n = Math.floor(n / 26) - 1;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: `ASSESSMENT_PLO!${col}${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });

  return true;
}
