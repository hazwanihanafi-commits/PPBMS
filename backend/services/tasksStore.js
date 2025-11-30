// backend/services/tasksStore.js
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "tasks.json");

async function ensureStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(STORE_FILE);
  } catch {
    // initialize empty store
    await fs.writeFile(STORE_FILE, JSON.stringify({ students: {} }, null, 2), "utf8");
  }
}

export async function readStore() {
  await ensureStore();
  const txt = await fs.readFile(STORE_FILE, "utf8");
  return JSON.parse(txt);
}

export async function writeStore(store) {
  await ensureStore();
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

// Return or create student entry
export async function getStudentEntry(studentEmail) {
  const store = await readStore();
  if (!store.students[studentEmail]) {
    store.students[studentEmail] = {
      email: studentEmail,
      ticks: {},           // { "Development Plan & Learning Contract": { studentTick: true, studentTickDate, supervisorApproved: false, supervisorApproveDate, docUrl: "" } }
      meta: {},            // optional metadata: name, programme, start_date etc.
    };
    await writeStore(store);
  }
  return store.students[studentEmail];
}

export async function setStudentMeta(studentEmail, meta) {
  const store = await readStore();
  store.students = store.students || {};
  store.students[studentEmail] = store.students[studentEmail] || { email: studentEmail, ticks: {}, meta: {} };
  store.students[studentEmail].meta = { ...(store.students[studentEmail].meta || {}), ...(meta || {}) };
  await writeStore(store);
  return store.students[studentEmail];
}

export async function setTick(studentEmail, key, studentEmailCaster, date, docUrl) {
  // studentEmailCaster is who ticked (should equal studentEmail normally)
  const store = await readStore();
  store.students = store.students || {};
  store.students[studentEmail] = store.students[studentEmail] || { email: studentEmail, ticks: {}, meta: {} };

  const now = date || new Date().toISOString();
  store.students[studentEmail].ticks[key] = {
    ...(store.students[studentEmail].ticks[key] || {}),
    studentTick: true,
    studentTickDate: now,
    studentWhoTicked: studentEmailCaster || "",
    docUrl: docUrl || (store.students[studentEmail].ticks[key] && store.students[studentEmail].ticks[key].docUrl) || ""
  };
  // when student ticks, reset supervisor approval
  store.students[studentEmail].ticks[key].supervisorApproved = false;
  store.students[studentEmail].ticks[key].supervisorApproveDate = "";
  await writeStore(store);
  return store.students[studentEmail].ticks[key];
}

export async function clearTick(studentEmail, key) {
  const store = await readStore();
  if (!store.students?.[studentEmail]) return null;
  store.students[studentEmail].ticks[key] = {
    ...(store.students[studentEmail].ticks[key] || {}),
    studentTick: false,
    studentTickDate: "",
  };
  await writeStore(store);
  return store.students[studentEmail].ticks[key];
}

export async function setSupervisorApproval(studentEmail, key, approverEmail, approve = true) {
  const store = await readStore();
  store.students = store.students || {};
  store.students[studentEmail] = store.students[studentEmail] || { email: studentEmail, ticks: {}, meta: {} };
  store.students[studentEmail].ticks[key] = store.students[studentEmail].ticks[key] || {};
  store.students[studentEmail].ticks[key].supervisorApproved = !!approve;
  store.students[studentEmail].ticks[key].supervisorApproveDate = approve ? new Date().toISOString() : "";
  store.students[studentEmail].ticks[key].supervisorWho = approverEmail || "";
  await writeStore(store);
  return store.students[studentEmail].ticks[key];
}

export async function listStudents() {
  const store = await readStore();
  return store.students || {};
}
