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

    return {
      matric: obj.matric || "",
      assessment_type: (obj.assessment_type || "").replace(/\s+/g, ""),
      ...obj
    };
  });
}


export async function updateASSESSMENT_PLO_Remark({
  studentMatric,
  assessmentType,
  remark
}) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // Read full sheet
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "ASSESSMENT_PLO!A1:ZZ999",
  });

  const rows = res.data.values || [];
  if (rows.length < 2) throw new Error("ASSESSMENT_PLO empty");

  const headers = rows[0].map(h =>
    h.toString().trim().toLowerCase()
  );

  const matricIdx = headers.indexOf("matric");
  const typeIdx = headers.indexOf("assessment_type");
  const remarkIdx = headers.indexOf("remarks");

  if (remarkIdx === -1) {
    throw new Error("Remarks column NOT FOUND in ASSESSMENT_PLO");
  }

  const rowIndex = rows.findIndex((r, i) =>
    i > 0 &&
    String(r[matricIdx]).trim() === String(studentMatric).trim() &&
    String(r[typeIdx]).toUpperCase().trim() === assessmentType
  );

  if (rowIndex === -1) {
    throw new Error("Assessment row not found for remark");
  }

  // Convert column index → letter
  function toColLetter(idx) {
    let s = "";
    while (idx >= 0) {
      s = String.fromCharCode((idx % 26) + 65) + s;
      idx = Math.floor(idx / 26) - 1;
    }
    return s;
  }

  const cell = `ASSESSMENT_PLO!${toColLetter(remarkIdx)}${rowIndex + 1}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: cell,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[remark]]
    }
  });

  return true;
}

