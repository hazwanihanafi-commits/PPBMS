// backend/utils/sheetCache.js
import { readMasterTracking } from "../services/googleSheets.js";

let cache = null;
let cacheAt = 0;
const TTL = 30 * 1000; // 30 sec cache (adjust as needed)

export async function getCachedSheet(sheetId) {
  if (cache && (Date.now() - cacheAt) < TTL) return cache;
  cache = await readMasterTracking(sheetId);
  cacheAt = Date.now();
  return cache;
}
