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
   MASTER TRACKING
========================================================= */
export async function readMasterTracking(sheetId) {
  return await readSheet(sheetId, "MasterTracking!A1:ZZ999");
}

/* =========================================================
   SAFE WRITE CELL (COLUMN NAME → A1)
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

  const range = `${sheetName}!${colLetter}${rowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });

  return true;
}

/* =========================================================
   AUTH USERS (LOGIN / ROLES)
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

  const toCol = idx => {
    let s = "";
    while (idx >= 0) {
      s = String.fromCharCode((idx % 26) + 65) + s;
      idx = Math.floor(idx / 26) - 1;
    }
    return s;
  };

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `AUTH_USERS!${toCol(passCol)}${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [[hash]] },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `AUTH_USERS!${toCol(setCol)}${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [["TRUE"]] },
  });

  return true;
}

/* =========================================================
   ASSESSMENT PLO
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

export async function updateASSESSMENT_PLO_Cell({
  sheetId,
  rowIndex,
  columnName,
  value
}) {
  return await writeSheetCell(
    sheetId,
    "ASSESSMENT_PLO",
    columnName,
    rowIndex,
    value
  );
}

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
  const headers = rows[0].map(h => h.toLowerCase().trim());

  const matricIdx = headers.indexOf("matric");
  const typeIdx = headers.indexOf("assessment_type");
  const remarkIdx = headers.indexOf("remarks");

  const rowIndex = rows.findIndex(
    (r, i) =>
      i > 0 &&
      String(r[matricIdx]).trim() === String(studentMatric).trim() &&
      String(r[typeIdx]).toUpperCase().trim() === assessmentType
  );

  if (rowIndex === -1) throw new Error("Assessment row not found");

  await writeSheetCell(
    process.env.SHEET_ID,
    "ASSESSMENT_PLO",
    "remarks",
    rowIndex + 1,
    remark
  );

  return true;
}

/* =========================================================
   FINAL PROGRAMME PLO
========================================================= */
export async function readFINALPROGRAMPLO(sheetId) {
  return await readSheet(sheetId, "FINALPROGRAMPLO!A1:Z");
}
