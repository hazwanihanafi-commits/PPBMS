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

  const headers = rows[0].map(h => (h || "").toString().trim());

  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  });
}

/* =========================================================
   MASTER TRACKING
========================================================= */
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
  return rows.slice(1).map(r => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = r[i] || ""));
    return obj;
  });
}

/* =========================================================
   GENERIC MASTER TRACKING CELL UPDATE
========================================================= */
export async function writeSheetCell(sheetId, columnName, rowNumber, value) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ1"
  });

  const headers = headerRes.data.values[0].map(h =>
    h.toString().trim().toLowerCase()
  );

  const colIdx = headers.indexOf(columnName.toLowerCase());
  if (colIdx === -1) throw new Error(`Column not found: ${columnName}`);

  const toColLetter = idx => {
    let s = "";
    while (idx >= 0) {
      s = String.fromCharCode((idx % 26) + 65) + s;
      idx = Math.floor(idx / 26) - 1;
    }
    return s;
  };

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `MasterTracking!${toColLetter(colIdx)}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] }
  });

  return true;
}

/* =========================================================
   ASSESSMENT_PLO READ
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

    return {
      matric: obj.matric || "",
      assessment_type: (obj.assessment_type || "").replace(/\s+/g, ""),
      ...obj
    };
  });
}

/* =========================================================
   UPDATE REMARK (ASSESSMENT_PLO)
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
  if (rows.length < 2) throw new Error("ASSESSMENT_PLO empty");

  const headers = rows[0].map(h => h.toString().trim().toLowerCase());

  const matricIdx = headers.indexOf("matric");
  const typeIdx = headers.indexOf("assessment_type");
  const remarkIdx = headers.indexOf("remarks");

  if (remarkIdx === -1)
    throw new Error("Remarks column not found in ASSESSMENT_PLO");

  const rowIndex = rows.findIndex((r, i) =>
    i > 0 &&
    String(r[matricIdx]).trim() === String(studentMatric).trim() &&
    String(r[typeIdx]).toUpperCase().trim() === assessmentType.toUpperCase()
  );

  if (rowIndex === -1)
    throw new Error("Assessment row not found for remark");

  const toColLetter = idx => {
    let s = "";
    while (idx >= 0) {
      s = String.fromCharCode((idx % 26) + 65) + s;
      idx = Math.floor(idx / 26) - 1;
    }
    return s;
  };

  const cell = `ASSESSMENT_PLO!${toColLetter(remarkIdx)}${rowIndex + 1}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: cell,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[remark]] }
  });

  return true;
}

/* =========================================================
   GENERIC ASSESSMENT_PLO CELL UPDATE
========================================================= */
export async function updateASSESSMENT_PLO_Cell({
  rowIndex,
  column,
  value
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
  if (colIdx === -1) throw new Error(`Column not found: ${column}`);

  const toColLetter = idx => {
    let s = "";
    while (idx >= 0) {
      s = String.fromCharCode((idx % 26) + 65) + s;
      idx = Math.floor(idx / 26) - 1;
    }
    return s;
  };

  const cell = `ASSESSMENT_PLO!${toColLetter(colIdx)}${rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: cell,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] }
  });


  return true;
}

   export async function readFINALPROGRAMPLO(sheetId) {
  const rows = await readSheet(
    sheetId,
    "FINALPROGRAMPLO!A1:Z"
  );
  return rows;
}

/* =========================================================
   UPDATE PASSWORD HASH (MASTERTRACKING)
========================================================= */
export async function updatePasswordHash({ email, hash }) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "MasterTracking!A1:ZZ999",
  });

  const rows = res.data.values || [];
  if (rows.length < 2) throw new Error("MasterTracking empty");

  const headers = rows[0].map(h => h.toString().trim().toLowerCase());

  const studentEmailIdx = headers.indexOf("student's email");
  const supervisorEmailIdx = headers.indexOf("main supervisor's email");
  const passwordIdx = headers.indexOf("password_hash");

  if (passwordIdx === -1) {
    throw new Error("PASSWORD_HASH column missing in MasterTracking");
  }

  const rowIndex = rows.findIndex((r, i) => {
    if (i === 0) return false;
    const studentEmail = (r[studentEmailIdx] || "").toLowerCase().trim();
    const supervisorEmail = (r[supervisorEmailIdx] || "").toLowerCase().trim();
    return studentEmail === email || supervisorEmail === email;
  });

  if (rowIndex === -1) {
    throw new Error("User not found for password update");
  }

  const toColLetter = idx => {
    let s = "";
    while (idx >= 0) {
      s = String.fromCharCode((idx % 26) + 65) + s;
      idx = Math.floor(idx / 26) - 1;
    }
    return s;
  };

  const cell = `MasterTracking!${toColLetter(passwordIdx)}${rowIndex + 1}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: cell,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[hash]] }
  });

  return true;
}
/* =========================================================
   AUTH USERS
========================================================= */
export async function readAuthUsers(sheetId) {
  return await readSheet(sheetId, "AUTH_USERS!A1:Z");
}

export async function updateAuthUserPassword({ email, hash }) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "AUTH_USERS!A1:Z",
  });

  const [headers, ...rows] = res.data.values;
  const emailCol = headers.indexOf("Email");
  const passCol = headers.indexOf("PasswordHash");
  const setCol = headers.indexOf("PasswordSet");

  const rowIndex = rows.findIndex(
    r => (r[emailCol] || "").toLowerCase().trim() === email
  );

  if (rowIndex === -1) throw new Error("User not found");

  const rowNum = rowIndex + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `AUTH_USERS!${String.fromCharCode(65 + passCol)}${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [[hash]] },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `AUTH_USERS!${String.fromCharCode(65 + setCol)}${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [["TRUE"]] },
  });
}

