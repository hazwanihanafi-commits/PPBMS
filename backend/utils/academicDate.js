// Parse academic commencement dates without ambiguous JS Date parsing.
export function parseAcademicDate(value) {
  if (value == null || String(value).trim() === '') return null;
  let y, m, d;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    y = value.getUTCFullYear(); m = value.getUTCMonth() + 1; d = value.getUTCDate();
  } else if (typeof value === 'number') {
    const date = new Date(Math.round((value - 25569) * 86400000));
    if (Number.isNaN(date.getTime())) return null;
    y = date.getUTCFullYear(); m = date.getUTCMonth() + 1; d = date.getUTCDate();
  } else {
    const s = String(value).trim();
    let match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/);
    if (match) [, y, m, d] = match;
    else {
      match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!match) return null;
      [, d, m, y] = match;
    }
    y = Number(y); m = Number(m); d = Number(d);
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === Number(y) && date.getUTCMonth() === Number(m)-1 && date.getUTCDate() === Number(d) ? date.toISOString().slice(0,10) : null;
}
export function academicToday() {
  return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}
