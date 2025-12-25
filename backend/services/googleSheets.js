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

/* =========================================================
   CQI EMAIL FLAG (ASSESSMENT_PLO)
========================================================= */

export async function markCQIEmailSent({
  sheetId,
  rowIndex
}) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // Convert column name → index by reading header
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "ASSESSMENT_PLO!A1:ZZ1",
  });

  const headers = headerRes.data.values[0].map(h =>
    h.toString().trim().toLowerCase()
  );

  const colIdx = headers.indexOf("cqi_email_sent");
  if (colIdx === -1) {
    throw new Error("CQI_EMAIL_SENT column not found in ASSESSMENT_PLO");
  }

  // Convert index → letter
  function toColLetter(idx) {
    let s = "";
    while (idx >= 0) {
      s = String.fromCharCode((idx % 26) + 65) + s;
      idx = Math.floor(idx / 26) - 1;
    }
    return s;
  }

  const cell = `ASSESSMENT_PLO!${toColLetter(colIdx)}${rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: cell,
    valueInputOption: "RAW",
    requestBody: {
      values: [["YES"]],
    },
  });

  return true;
}

// ✅ Generic single-cell updater for ASSESSMENT_PLO
export async function updateASSESSMENT_PLO_Cell({
  rowIndex,
  column,
  value
}) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // Read header to find column index
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "ASSESSMENT_PLO!A1:ZZ1",
  });

  const headers = headerRes.data.values[0].map(h =>
    h.toString().trim().toLowerCase()
  );

  const colIdx = headers.indexOf(column.toLowerCase());
  if (colIdx === -1) {
    throw new Error(`Column not found: ${column}`);
  }

  // Convert index → column letter
  function toColLetter(idx) {
    let s = "";
    while (idx >= 0) {
      s = String.fromCharCode((idx % 26) + 65) + s;
      idx = Math.floor(idx / 26) - 1;
    }
    return s;
  }

  const cell = `ASSESSMENT_PLO!${toColLetter(colIdx)}${rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: cell,
    valueInputOption: "RAW",
    requestBody: {
      values: [[value]]
    }
  });

  return true;
}

