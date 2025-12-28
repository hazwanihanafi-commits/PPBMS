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
    scopes: readonly
      ? ["https://www.googleapis.com/auth/spreadsheets.readonly"]
      : ["https://www.googleapis.com/auth/spreadsheets"],
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
    range,
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toString().trim());

  return rows.slice(1).map(row =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] || ""]))
  );
}

/* =========================================================
   MASTER TRACKING READ
========================================================= */
export async function readMasterTracking(sheetId) {
  return await readSheet(sheetId, "MasterTracking!A1:ZZ999");
}

/* =========================================================
   GENERIC WRITE CELL (A1 NOTATION – SINGLE SOURCE OF TRUTH)
========================================================= */
export async function writeSheetCell(sheetId, range, value) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range, // e.g. MasterTracking!F12
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });

  return true;
}

/* =========================================================
   AUTH USERS
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
    range: "AUTH_USERS!A1:Z",
  });

  const [headers, ...rows] = res.data.values;
  const norm = h => h.toLowerCase().trim();

  const emailCol = headers.findIndex(h => norm(h) === "email");
  const passCol  = headers.findIndex(h => norm(h) === "passwordhash");
  const setCol   = headers.findIndex(h => norm(h) === "passwordset");

  if (emailCol === -1 || passCol === -1 || setCol === -1)
    throw new Error("AUTH_USERS headers missing");

  const rowIndex = rows.findIndex(
    r => (r[emailCol] || "").toLowerCase().trim() === email.toLowerCase()
  );
  if (rowIndex === -1) throw new Error("User not found");

  const rowNum = rowIndex + 2;

  const col = n => {
    let s = "";
    while (n >= 0) {
      s = String.fromCharCode((n % 26) + 65) + s;
      n = Math.floor(n / 26) - 1;
    }
    return s;
  };

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
