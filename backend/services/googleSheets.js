import { google } from "googleapis";

export async function readMasterTracking(sheetId) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ999",
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) return [];

  const header = rows[0];
  return rows.slice(1).map((row) => {
    const obj = {};
    header.forEach((col, idx) => {
      obj[col] = row[idx] || "";
    });
    return obj;
  });
}
