// backend/services/googleSheets.js
import { google } from "googleapis";
import fs from "fs";

// SCOPES for Sheets + Drive read
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.readonly"
];

// Load service account file
function getKey() {
  const p = process.env.SERVICE_ACCOUNT_PATH || "./service-account.json";
  if (!fs.existsSync(p)) {
    throw new Error("Service account JSON not found at: " + p);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// Return Google Auth object
export function getAuth() {
  const key = getKey();
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: SCOPES,
  });
  return auth;
}

// Return Sheets client
export async function getSheetsClient() {
  const auth = getAuth();
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

// Read range & return rows with headers mapped to object
export async function readMasterTracking(spreadsheetId, range = "MasterTracking!A:ZZ") {
  const sheets = await getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = res.data.values || [];
  if (rows.length === 0) return [];

  const header = rows[0];
  return rows.slice(1).map((row) => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = row[i] || ""));
    return obj;
  });
}
