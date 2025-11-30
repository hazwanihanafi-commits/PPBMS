// backend/utils/sheetCache.js
import { readMasterTracking } from "../services/googleSheets.js";

let cache = {
  timestamp: 0,
  data: null,
};

export const CACHE_DURATION_MS = 5000; // 5 seconds

export async function getCachedSheet(sheetId) {
  const now = Date.now();

  // return cached data if still valid
  if (cache.data && now - cache.timestamp < CACHE_DURATION_MS) {
    return cache.data;
  }

  // fetch fresh
  const rows = await readMasterTracking(sheetId);
  cache = {
    timestamp: now,
    data: rows,
  };
  return rows;
}

export function clearCache() {
  cache = {
    timestamp: 0,
    data: null,
  };
}
