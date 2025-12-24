import fs from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "data/alert-log.json");

export async function logAlert(entry) {
  let data = [];
  try {
    data = JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {}

  data.push({ ...entry, timestamp: new Date().toISOString() });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}
