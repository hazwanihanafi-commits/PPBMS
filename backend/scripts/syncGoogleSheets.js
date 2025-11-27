// backend/scripts/syncGoogleSheets.js
// Run this as a cron job OR manually (node syncGoogleSheets.js)

// INSTALL REQUIRED PACKAGES:
// npm install googleapis axios

const { google } = require("googleapis");
const axios = require("axios");
const { normalizeJotFormRow } = require("../utils/normalizeJotForm"); // your existing mapper

// ---- CONFIG ---- //
const SHEET_ID = process.env.GSHEET_ID; 
const RANGE = "Sheet1!A:Z"; // adjust if needed
const BACKEND_API = process.env.PPBMS_BACKEND + "/api/sync/upsert"; 
/*
Your backend should expose:
POST /api/sync/upsert { student: normalizedObject }
*/
const GOOGLE_CREDENTIALS = JSON.parse(process.env.GSHEET_CREDENTIALS_JSON); 

// ---- AUTH ---- //
async function getSheetsInstance() {
  const auth = new google.auth.JWT(
    GOOGLE_CREDENTIALS.client_email,
    null,
    GOOGLE_CREDENTIALS.private_key,
    ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  );
  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

async function sync() {
  console.log("🔄 Syncing Google Sheets → PPBMS backend…");

  try {
    const sheets = await getSheetsInstance();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) {
      console.log("❗ No rows in sheet.");
      return;
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    for (const r of dataRows) {
      const record = {};
      headers.forEach((h, i) => {
        record[h] = r[i] || "";
      });

      // 🔧 Normalize into student DB format
      const normalized = normalizeJotFormRow(record);

      // 🔧 Upsert into backend
      await axios.post(BACKEND_API, { student: normalized });

      console.log(`✅ Synced: ${normalized.student_id} — ${normalized.student_name}`);
    }

    console.log("✨ Sync complete.");
  } catch (err) {
    console.error("❌ Sync failed:", err.message);
  }
}

sync();
