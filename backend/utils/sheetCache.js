// backend/utils/sheetCache.js
import { readMasterTracking } from "../services/googleSheets.js";

let cache = null;
let lastFetch = 0;
const TTL = 30000; // 30 seconds

export async function getCachedSheet(sheetId) {
  const now = Date.now();

  if (!cache || now - lastFetch > TTL) {
    cache = await readMasterTracking(sheetId);
    lastFetch = now;
  }

  return cache;
}

export function resetSheetCache() {
  cache = null;
}
