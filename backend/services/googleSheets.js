import { google } from "googleapis";

/** Internal Auth Helper */
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
    ]
  });
}

/** Read full MasterTracking sheet */
export async function readMasterTracking(sheetId) {
  const auth = getAuth(true);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ999"
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const header = rows[0];
  const output = rows.slice(1).map(r => {
    const obj = {};
    header.forEach((h, i) => obj[h] = r[i] || "");
    return obj;
  });

  return output;
}

/** Convert number to sheet letters (A, B… AA, AB…) */
function toColLetter(idx) {
  let s = "";
  while (idx >= 0) {
    s = String.fromCharCode((idx % 26) + 65) + s;
    idx = Math.floor(idx / 26) - 1;
  }
  return s;
}

/** Write Date + URL to Google Sheet */
export async function writeStudentActual(
  sheetId,
  rowNumber,
  actualColumnName,
  urlColumnName,
  actualDate,
  url
) {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // Get headers to identify correct columns
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ1"
  });

  const headers = headerRes.data.values[0];

  const actualIdx = headers.indexOf(actualColumnName);
  const urlIdx = headers.indexOf(urlColumnName);

  if (actualIdx === -1) {
    throw new Error("Column not found: " + actualColumnName);
  }
  if (urlIdx === -1) {
    throw new Error("Column not found: " + urlColumnName);
  }

  const updates = [];

  export async function writeStudentActual(
  sheetId,
  rowNumber,
  actualColumn,
  urlColumn,
  date,
  fileURL
) {
  const updates = {
    [actualColumn]: date
  };

  // Only include URL column if it exists
  if (urlColumn) {
    updates[urlColumn] = fileURL;
  }

  await writeToSheet(sheetId, rowNumber, updates);
}


  // Write File URL
  if (url) {
    updates.push({
      range: `MasterTracking!${toColLetter(urlIdx)}${rowNumber}`,
      values: [[url]]
    });
  }

  if (updates.length === 0) return true;

  // Send both updates in 1 request
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: updates
    }
  });

  return true;
}
export function writeToSheet() {
  throw new Error("writeToSheet is deprecated. Use writeStudentActual instead.");
}
