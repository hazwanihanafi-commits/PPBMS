import { google } from 'googleapis';
import fs from 'fs';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly'];

function getKey() {
  const p = process.env.SERVICE_ACCOUNT_PATH || './service-account.json';
  if (!fs.existsSync(p)) throw new Error('Service account JSON not found at ' + p);
  return JSON.parse(fs.readFileSync(p,'utf8'));
}

export function getAuth() {
  const key = getKey();
  const auth = new google.auth.GoogleAuth({ credentials: key, scopes: SCOPES });
  return auth;
}

export async function getSheetsClient() {
  const auth = getAuth();
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

export async function readAllRows(spreadsheetId, range) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h,i)=> obj[h] = r[i] || '');
    return obj;
  });
}
