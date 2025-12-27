import { google } from "googleapis";

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function readAuthUsers(sheetId) {
  const auth = getAuth();
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "AUTH_USERS!A1:E",
  });

  const [header, ...rows] = res.data.values || [];
  if (!header) return [];

  return rows.map(r =>
    Object.fromEntries(header.map((h, i) => [h, r[i] || ""]))
  );
}

export async function updateAuthUserPassword({ email, hash }) {
  const auth = getAuth();
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "AUTH_USERS!A1:E",
  });

  const [header, ...rows] = res.data.values;
  const emailIdx = header.indexOf("Email");
  const passIdx = header.indexOf("PasswordHash");
  const setIdx = header.indexOf("PasswordSet");

  const rowIndex = rows.findIndex(
    r => (r[emailIdx] || "").toLowerCase().trim() === email
  );

  if (rowIndex === -1) throw new Error("User not found");

  const rowNum = rowIndex + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: `AUTH_USERS!${String.fromCharCode(65 + passIdx)}${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [[hash]] },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: `AUTH_USERS!${String.fromCharCode(65 + setIdx)}${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [["TRUE"]] },
  });
}
