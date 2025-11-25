import { readAllRows } from '../services/sheetsClient.js';
import dotenv from 'dotenv';
dotenv.config();

const MILESTONE_CODES = [ 'ETHICS','PROPOSAL','DATA1','DATA2','SEMINAR','PROGRESS1','THESIS' ];

function parseDate(s){ if(!s) return null; const d = new Date(s); if(isNaN(d)) return null; return d; }
function daysBetween(a,b){ return Math.ceil((b-a)/(1000*60*60*24)); }

function milestoneStatus(planned, actual, today){
  if(!planned) return 'MissingPlannedDate';
  if(actual) return actual.getTime() > planned.getTime() ? 'Late' : 'On-time';
  if(today.getTime() > planned.getTime()) return 'Late';
  const left = daysBetween(today, planned);
  if(left <= 14) return 'Due soon';
  return 'On-time';
}

export async function runLatenessCheck(){
  const sheetId = process.env.SHEET_ID;
  if(!sheetId) throw new Error('SHEET_ID not set');
  const rows = await readAllRows(sheetId, 'MasterTracking!A:ZZ');
  const today = new Date();
  const summary = { total: rows.length, lateCases: [] };
  for(const row of rows){
    let lateCount = 0;
    for(const code of MILESTONE_CODES){
      const planned = parseDate(row[`planned_${code}`]);
      const actual = parseDate(row[`actual_${code}`]);
      const status = milestoneStatus(planned, actual, today);
      row[`status_${code}`] = status;
      if(status === 'Late') lateCount++;
    }
    const atRisk = lateCount >= 2 || (row.p4_missing_months_count && Number(row.p4_missing_months_count) >= 2) || (row.p3_entries_last_4_weeks_count && Number(row.p3_entries_last_4_weeks_count) === 0);
    if(atRisk) summary.lateCases.push({ matric: row.matric || row.student_name, lateCount, row });
  }
  // For now log summary. In production: write back statuses and send emails.
  console.log('Lateness summary:', JSON.stringify({ total: summary.total, atRisk: summary.lateCases.length }, null, 2));
  if(summary.lateCases.length) console.table(summary.lateCases.map(r=>({matric:r.matric, lateCount:r.lateCount})));
  return summary;
}
