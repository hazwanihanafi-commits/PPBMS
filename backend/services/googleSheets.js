// backend/services/googleSheets.js
import { google } from "googleapis";

function getAuth(readonly = true) {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: [
      readonly
        ? "https://www.googleapis.com/auth/spreadsheets.readonly"
        : "https://www.googleapis.com/auth/spreadsheets"
    ]
  });
}

export async function readStudentSheet(sheetId) {
  const auth = getAuth(true);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Tracking!A1:F999",
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) return [];

  const header = rows[0];
  return rows.slice(1).map(r => {
    const obj = {};
    header.forEach((h, i) => obj[h] = r[i] || "");
    return obj;
  });
}

export async function writeStudentActual(sheetId, activity, url = "", date = "") {
  const auth = getAuth(false);
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // Load sheet
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Tracking!A1:F999"
  });

  const rows = res.data.values;
  const header = rows[0];

  const activityIndex = rows.findIndex(r => r[0] === activity);
  if (activityIndex === -1) throw new Error("Activity not found in sheet");

  const actualCol = header.indexOf("Actual Date");
  const urlCol = header.indexOf("Submission URL");

  const rowNum = activityIndex + 1;

  const values = [];
  if (date) values.push({ col: actualCol, val: date });
  if (url) values.push({ col: urlCol, val: url });

  for (const v of values) {
    const colLetter = String.fromCharCode(65 + v.col);
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Tracking!${colLetter}${rowNum}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[v.val]] }
    });
  }
  return true;
}
