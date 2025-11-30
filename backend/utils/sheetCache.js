// backend/utils/sheetCache.js
import { readMasterTracking } from "../services/googleSheets.js";

let cache = {
  timestamp: 0,
  data: null,
};

const CACHE_DURATION_MS = 5000; // 5 seconds cache

export async function getCachedSheet(sheetId) {
  const now = Date.now();

  // valid cache
  if (cache.data && now - cache.timestamp < CACHE_DURATION_MS) {
    return cache.data;
  }

  // fetch fresh
  const rows = await readMasterTracking(sheetId);
  cache = { timestamp: now, data: rows };
  return rows;
}

// force clear for debugging
export function clearCache() {
  cache = { timestamp: 0, data: null };
}
