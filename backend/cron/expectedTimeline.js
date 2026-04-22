// backend/cron/expectedTimeline.js

import {
  readMasterTracking,
  writeSheetCell
} from "../services/googleSheets.js";

import {
  buildExpectedOnly
} from "../utils/buildTimeline.js";

export async function generateExpectedTimeline() {

  const sheetId = process.env.SHEET_ID;

  if (!sheetId) {
    throw new Error("Missing SHEET_ID");
  }

  const rows = await readMasterTracking(sheetId);

  console.log(
    "📅 CRON: rows to process:",
    rows.length
  );

  const cache = [];

  for (let i = 0; i < rows.length; i++) {

    const row = rows[i];
    const rowNumber = i + 2;

    const expected = buildExpectedOnly(row);

    cache.push({
      email: row["Student's Email"],
      expected
    });

    /* =========================================
       WRITE EXPECTED DATES TO SHEET
    ========================================= */
    for (const item of expected) {

      if (!item.expectedDate) continue;

      try {

        await writeSheetCell(
          sheetId,
          "MasterTracking",
          item.sheetColumn,
          rowNumber,
          item.expectedDate
        );

        console.log(
          `✅ Wrote expected date → ${item.sheetColumn} (Row ${rowNumber})`
        );

      } catch (e) {

        console.warn(
          "❌ CRON write expected failed:",
          e?.message || e
        );
      }
    }
  }

  global.expectedTimelineCache = cache;

  console.log(
    "✅ expectedTimelineCache length:",
    cache.length
  );

  return cache;
}
