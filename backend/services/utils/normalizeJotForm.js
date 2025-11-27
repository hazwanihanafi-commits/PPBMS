// utils/normalizeJotForm.js
// Input: raw object from JotForm / Google Sheets (keys may vary).
// Output: normalized record with student_id, milestones map, documents, meta.

const parseDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10); // YYYY-MM-DD
};

function normalizeJotFormRow(row) {
  // row: object with keys like:
  // Student Name, Matric No, Programme, Start Date, Student's Email,
  // Main Supervisor, Main Supervisor's Email, Timeline/ Milestones,
  // Submission Date, Submission URL, Submission ID, Last Update Date, etc.

  const studentId = (row['Matric No'] || row['matric_no'] || row.matric || row['Matric'] || '').toString().trim();
  const name = (row['Student Name'] || row['student_name'] || row.name || '').trim();
  const programme = row['Programme'] || row.programme || row['Program'] || '';
  const mainSupervisor = row['Main Supervisor'] || row.main_supervisor || row['Supervisor'] || '';
  const mainSupervisorEmail = row['Main Supervisor\\'s Email'] || row.main_supervisor_email || row['Supervisor Email'] || '';
  const studentEmail = row["Student's Email"] || row.student_email || row['Email'] || '';

  // Dates
  const startDate = parseDate(row['Start Date'] || row.start_date);
  const lastUpdate = row['Last Update Date'] || row.last_update || row['Last Updated'] || null;
  const submissionDate = parseDate(row['Submission Date'] || row.submission_date);

  // Documents
  const submissionUrl = row['Submission URL'] || row.submission_url || null;
  const submissionId = row['Submission ID'] || row.submission_id || null;

  // If the form includes a "Timeline / Milestones" free-text, try to parse expected dates.
  // But usually you will have a separate source for expected dates (we recommend storing them centrally).
  // For now create a fallback mapping: use known DUEs if not present.
  const DUE = {
    P1: '2024-08-31',
    P3: '2025-01-31',
    P4: '2025-02-15',
    P5: '2025-10-01',
  };

  // If the row explicitly has P1/P3/P4/P5 columns, use them
  const mk = (key) => row[key] || row[key.toLowerCase().replace(/\s+/g, '_')] || null;

  const normalized = {
    student_id: studentId || name,
    student_name: name || 'Unknown',
    programme,
    student_email: studentEmail,
    main_supervisor: mainSupervisor,
    main_supervisor_email: mainSupervisorEmail,
    last_update: lastUpdate || new Date().toISOString(),
    submission_source: {
      platform: 'jotform',
      submission_id: submissionId,
      submission_url: submissionUrl,
      raw_row: row,
    },
    // We'll use a milestones map keyed by P1,P3,P4,P5
    milestones: {
      P1: {
        start: parseDate(row['P1 Start'] || row.p1_start) || startDate || null,
        expected: parseDate(row['P1 Expected'] || row.p1_expected) || DUE.P1,
        actual: parseDate(row['P1 Submitted'] || row.p1_submitted) || (submissionDate && (row['submissionstage'] === 'P1' || row['submissionstage'] === 'P1 Submitted') ? submissionDate : null),
        approved: mk('P1 Approved') ? !!String(mk('P1 Approved')).match(/true|yes|approved/i) : null,
        approval_date: parseDate(mk('P1 Approval Date')),
      },
      P3: {
        start: parseDate(row['P3 Start'] || row.p3_start) || null,
        expected: parseDate(row['P3 Expected'] || row.p3_expected) || DUE.P3,
        actual: parseDate(row['P3 Submitted'] || row.p3_submitted) || (submissionDate && (row['submissionstage'] === 'P3' || row['submissionstage'] === 'P3 Submitted') ? submissionDate : null),
        approved: mk('P3 Approved') ? !!String(mk('P3 Approved')).match(/true|yes|approved/i) : null,
        approval_date: parseDate(mk('P3 Approval Date')),
      },
      P4: {
        start: parseDate(row['P4 Start'] || row.p4_start) || null,
        expected: parseDate(row['P4 Expected'] || row.p4_expected) || DUE.P4,
        actual: parseDate(row['P4 Submitted'] || row.p4_submitted) || (submissionDate && (row['submissionstage'] === 'P4' || row['submissionstage'] === 'P4 Submitted') ? submissionDate : null),
        approved: mk('P4 Approved') ? !!String(mk('P4 Approved')).match(/true|yes|approved/i) : null,
        approval_date: parseDate(mk('P4 Approval Date')),
      },
      P5: {
        start: parseDate(row['P5 Start'] || row.p5_start) || null,
        expected: parseDate(row['P5 Expected'] || row.p5_expected) || DUE.P5,
        actual: parseDate(row['P5 Submitted'] || row.p5_submitted) || (submissionDate && (row['submissionstage'] === 'P5' || row['submissionstage'] === 'P5 Submitted') ? submissionDate : null),
        approved: mk('P5 Approved') ? !!String(mk('P5 Approved')).match(/true|yes|approved/i) : null,
        approval_date: parseDate(mk('P5 Approval Date')),
      },
    },
    documents: [],
    notes: row['Notes'] || row.notes || null,
  };

  // attach any document fields
  ['Submission URL','submission_url','Document URL','document_url','P1 Document','P3 Document','P4 Document','P5 Document'].forEach((k) => {
    if (row[k]) {
      normalized.documents.push({ url: row[k], type: k, uploaded_at: parseDate(row['Submission Date'] || row.submission_date) });
    }
  });

  // ensure dates are strings or null
  Object.keys(normalized.milestones).forEach((m) => {
    const mm = normalized.milestones[m];
    if (mm.start === null && mm.expected) {
      // derive a start as 30% before expected if no start present (mark derived)
      const ed = mm.expected;
      if (ed) {
        const d = new Date(ed);
        const derived = new Date(d.getTime() - 1000 * 60 * 60 * 24 * 90); // -90d
        mm.start = derived.toISOString().slice(0,10);
        mm._derived_start = true;
      }
    }
  });

  return normalized;
}

module.exports = { normalizeJotFormRow };
