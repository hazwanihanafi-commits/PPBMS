import { google } from "googleapis";
import fs from "fs";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.readonly",
];

// Load service-account JSON
function getKey() {
  const p = process.env.SERVICE_ACCOUNT_PATH || "./service-account.json";
  if (!fs.existsSync(p)) {
    throw new Error("Service account JSON not found at " + p);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function getAuth() {
  const key = getKey();
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: SCOPES,
  });
}

export async function getSheetsClient() {
  const auth = getAuth();
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

// Reads MasterTracking sheet and returns array of objects
export async function readMasterTracking(spreadsheetId, range = "MasterTracking!A:ZZ") {
  const sheets = await getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = res.data.values || [];
  if (!rows.length) return [];

  const header = rows[0];
  return rows.slice(1).map((row) => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = row[i] || ""));
    return obj;
  });
}
