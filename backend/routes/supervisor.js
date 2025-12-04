/* -------------------------------------------------------
   GET /api/supervisor/student/:email
   Supervisor views ONE student's full progress
------------------------------------------------------- */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const targetEmail = (req.params.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find((r) =>
      (r["Student's Email"] || "").toLowerCase().trim() === targetEmail
    );

    if (!raw) return res.status(404).json({ error: "Student not found" });

    const timeline = buildTimelineForRow(raw);
    const progress = calcProgress(timeline);
    const rowNumber = rows.indexOf(raw) + 2;

    return res.json({
      id:
        raw["Matric"] ||
        raw["Matric No"] ||
        raw["Student ID"] ||
        raw["StudentID"] ||
        "",

      matric:
        raw["Matric"] ||
        raw["Matric No"] ||
        raw["Student ID"] ||
        raw["StudentID"] ||
        "",

      name: raw["Student Name"] || "-",
      email: raw["Student's Email"] || "-",
      programme: raw["Programme"] || "-",
      start_date: raw["Start Date"] || "-",
      field: raw["Field"] || "-",
      department: raw["Department"] || "-",
      supervisor: raw["Main Supervisor"] || "-",
      cosupervisor: raw["Co-Supervisor(s)"] || "-",
      supervisorEmail: raw["Main Supervisor's Email"] || "-",
      progress,
      rowNumber,
      timeline,
    });

  } catch (err) {
    console.error("supervisor/student error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;

