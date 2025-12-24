import fs from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "data/auth-users.json");

async function ensureFile() {
  try { await fs.access(FILE); }
  catch { await fs.writeFile(FILE, "{}"); }
}

export async function readAuth() {
  await ensureFile();
  const data = await fs.readFile(FILE, "utf8");
  return JSON.parse(data || "{}");
}

export async function getAuthUser(email) {
  const users = await readAuth();
  return users[email] || null;
}

export async function saveAuthUser(email, payload) {
  const users = await readAuth();
  users[email] = payload;
  await fs.writeFile(FILE, JSON.stringify(users, null, 2));
}
