import { readASSESSMENT_PLO } from "../services/googleSheets.js";

/**
 * FINAL PLO PER STUDENT
 * Average across ALL assessments
 * MQA-compliant
 */
export async function readFinalPLOAggregate(programme, sheetId) {
  const rows = await readASSESSMENT_PLO(sheetId);

  // 1️⃣ Filter programme
  const programmeRows = rows.filter(
    r => String(r.programme || "").trim() === programme
  );

  // 2️⃣ Group by student email
  const byStudent = {};
  programmeRows.forEach(r => {
    const email = String(r.student_s_email || "")
      .toLowerCase()
      .trim();

    if (!email) return;
    if (!byStudent[email]) byStudent[email] = [];
    byStudent[email].push(r);
  });

  // 3️⃣ Keep only GRADUATED students
  const graduates = Object.values(byStudent).filter(records =>
    records.some(
      r => String(r.status || "").toLowerCase() === "graduated"
    )
  );

  // 4️⃣ Compute FINAL PLO per student
  const finalPLOPerStudent = graduates.map(records => {
    const plo = {};

    for (let i = 1; i <= 11; i++) {
      const key = `PLO${i}`;
      const values = records
        .map(r => Number(r[key]))
        .filter(v => !isNaN(v));

      const average =
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : null;

      plo[key] = {
        average,
        status:
          average === null
            ? "Not Assessed"
            : average >= 3
            ? "Achieved"
            : "CQI Required",
      };
    }

    return plo;
  });

  return finalPLOPerStudent;
}
