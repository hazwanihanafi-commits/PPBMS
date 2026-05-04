import db from "../config/db.js";

export async function getFullStudentProfile(email) {
  try {
    const [student] = await db.query(
      "SELECT * FROM students WHERE email = ?",
      [email]
    );

    if (!student.length) {
      throw new Error("Student not found");
    }

    const [timeline] = await db.query(
      "SELECT * FROM milestones WHERE student_email = ? ORDER BY id ASC",
      [email]
    );

    const [remarks] = await db.query(
      "SELECT * FROM supervisor_remarks WHERE student_email = ? ORDER BY created_at DESC",
      [email]
    );

    const [plo] = await db.query(
      "SELECT * FROM plo_results WHERE student_email = ?",
      [email]
    );

    const completed = timeline.filter(t => t.status === "Completed").length;
    const late = timeline.filter(t => t.status === "Late").length;
    const dueSoon = timeline.filter(t => t.status === "Due Soon").length;

    return {
      student: student[0],
      timeline,
      remarks,
      finalPLO: plo,
      stats: { completed, late, dueSoon }
    };

  } catch (err) {
    console.error("ERROR:", err);
    throw err;
  }
}
