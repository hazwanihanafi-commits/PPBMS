import { google } from "googleapis";

/* ============================================================
   SAFE GOOGLE AUTH (NO CRASH IF ENV MISSING)
   ============================================================ */

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is missing in environment variables"
    );
  }

  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch (e) {
    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON format");
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
  });
}

/* ============================================================
   READ MASTERTRACKING
   ============================================================ */
export async function readMasterTracking(sheetId) {
  const auth = getAuth();
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "MasterTracking!A1:ZZ999",
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const header = rows[0];
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = r[i] || ""));
    return obj;
  });
}
