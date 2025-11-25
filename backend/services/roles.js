import dotenv from 'dotenv';
import { readAllRows } from './sheetsClient.js';
dotenv.config();

// Simple mapping logic:
// - If email in ADMIN_EMAILS -> admin
// - If email exists in MasterTracking sheet as supervisor -> supervisor
// - If email exists in MasterTracking as student_email -> student
export async function mapEmailToRole(email){
  const admins = (process.env.ADMIN_EMAILS || '').split(',').map(s=>s.trim()).filter(Boolean);
  if (admins.includes(email)) return 'admin';
  try {
    const rows = await readAllRows(process.env.SHEET_ID, 'MasterTracking!A:ZZ');
    for(const r of rows){
      if ((r.supervisor_email || '').toLowerCase() === email.toLowerCase()) return 'supervisor';
      if ((r.student_email || '').toLowerCase() === email.toLowerCase()) return 'student';
    }
  } catch(e){
    console.warn('roles: failed to read sheet', e.message);
  }
  // default fallback: viewer
  return 'viewer';
}
