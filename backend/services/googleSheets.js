// backend/services/googleSheets.js   (replace)
import { google } from "googleapis";

export async function readMasterTracking(sheetId) {
  try {
    if (!sheetId) throw new Error("Missing SHEET_ID env var");

    const rawCred = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!rawCred) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON env var");

    let credentials;
    try {
      credentials = JSON.parse(rawCred);
    } catch (e) {
      console.error("Google SA JSON parse error:", e.message);
      throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON (JSON parse failed)");
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "MasterTracking!A1:ZZ999",
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) {
      console.warn("GoogleSheet: no rows returned (sheet may be empty)");
      return [];
    }

    const header = rows[0].map((h) => (h || "").toString());
    const results = rows.slice(1).map((row) => {
      const obj = {};
      header.forEach((col, idx) => {
        obj[col] = row[idx] || "";
      });
      return obj;
    });

    return results;
  } catch (err) {
    // log full error for debugging (careful: do NOT leak credentials)
    console.error("readMasterTracking ERROR:", err && err.message ? err.message : err);
    throw err; // rethrow so caller can handle
  }
}
