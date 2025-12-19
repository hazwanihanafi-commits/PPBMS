// backend/services/googleSheets.js
import { google } from "googleapis";

/** internal auth helper */
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

/** read full MasterTracking sheet into array of objects */
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
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = r[i] || ""));
    return obj;
  });
}

/** write single cell by column name (sheetName assumed MasterTracking) */
export async function writeSheetCell(sheetId, columnName, rowNumber, value) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `MasterTracking!A1:ZZ1`
  });
  const headers = headerRes.data.values[0];

  const idx = headers.indexOf(columnName);
  if (idx === -1) {
    throw new Error("Column not found: " + columnName);
  }

  // convert 0-based index to A..Z..AA
  function toColLetter(idx) {
    let s = "";
    while (idx >= 0) {
      s = String.fromCharCode((idx % 26) + 65) + s;
      idx = Math.floor(idx / 26) - 1;
    }
    return s;
  }
  const colLetter = toColLetter(idx);

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `MasterTracking!${colLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] }
  });

  return true;
}

/** Write Date + URL(s) for a student row (rowNumber is 1-indexed sheet row) */
export async function writeStudentActual(sheetId, rowNumber, actualColumnName, urlColumnName, actualDate, url) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `MasterTracking!A1:ZZ1`
  });
  const headers = headerRes.data.values[0];

  const actualIdx = headers.indexOf(actualColumnName);
  const urlIdx = urlColumnName ? headers.indexOf(urlColumnName) : -1;

  if (actualIdx === -1) throw new Error("Column not found: " + actualColumnName);
  if (urlColumnName && urlIdx === -1) throw new Error("Column not found: " + urlColumnName);

  function toColLetter(idx) {
    let s = "";
    while (idx >= 0) {
      s = String.fromCharCode((idx % 26) + 65) + s;
      idx = Math.floor(idx / 26) - 1;
    }
    return s;
  }

  const updates = [];
  if (actualDate !== undefined) {
    updates.push({
      range: `MasterTracking!${toColLetter(actualIdx)}${rowNumber}`,
      values: [[actualDate]]
    });
  }
  if (url && urlIdx !== -1) {
    updates.push({
      range: `MasterTracking!${toColLetter(urlIdx)}${rowNumber}`,
      values: [[url]]
    });
  }

  if (updates.length === 0) return true;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { valueInputOption: "USER_ENTERED", data: updates }
  });

  return true;
}

/* =========================================================
   DOCUMENTS SHEET HELPERS (PPBMS – Fail Pelajar)
   Safe to add – does NOT affect MasterTracking
========================================================= */

/** Read generic sheet into array of objects */
export async function readSheet(sheetId, sheetName) {
  const auth = getAuth(true);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ999`,
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const header = rows[0].map(h => (h || "").toString());
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = r[i] || ""));
    return obj;
  });
}

/** Append one row to a sheet (DOCUMENTS) */
export async function appendRow(sheetId, sheetName, data) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [Object.values(data)],
    },
  });

  return true;
}

export async function readAssessmentPLO(sheetId) {
  const rows = await readMasterTracking(sheetId, "ASSESSMENT_PLO");

  return rows.map(r => ({
    Student_Email: (r["Student_Email"] || "").toLowerCase().trim(),
    Assessment_Type: r["Assessment_Type"],
    Academic_Year: r["Academic_Year"],
    Scoring_Type: r["Scoring_Type"],
    ...r
  }));
}


