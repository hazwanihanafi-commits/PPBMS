// backend/cron/expectedTimeline.js
import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";
import { buildExpectedOnly } from "../utils/buildTimeline.js";

export async function generateExpectedTimeline() {
  const sheetId = process.env.SHEET_ID;
  if (!sheetId) throw new Error("Missing SHEET_ID");

  const rows = await readMasterTracking(sheetId);
  console.log("CRON: rows to process:", rows.length);

  const cache = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;
    const expected = buildExpectedOnly(row);

    cache.push({ email: row["Student's Email"], expected });

    // Write expected dates to the sheet for each activity
    for (const item of expected) {
      if (!item.expectedDate) continue;
      try {
        await writeSheetCell(sheetId, item.sheetColumn, rowNumber, item.expectedDate);
      } catch (e) {
        // If column missing, we skip (you should add header row columns suggested earlier)
        console.warn("CRON write expected failed:", e?.message || e);
      }
    }
  }

  global.expectedTimelineCache = cache;
  console.log("CRON: expectedTimelineCache length:", cache.length);
  return cache;
}
