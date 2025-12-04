/* -------------------------------------------------------
   GET /api/supervisor/student/:email
------------------------------------------------------- */
router.get("/student/:email", auth, async (req, res) => {
  try {
    const targetEmail = (req.params.email || "").toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const raw = rows.find((r) => getStudentEmail(r) === targetEmail);

    if (!raw) {
      return res.status(404).json({ error: "Student not found" });
    }

    const timeline = buildTimelineForRow(raw);
    const progressPercent = calcProgress(timeline);
    const rowNumber = rows.indexOf(raw) + 2;

    return res.json({
      // FULL PROFILE FIELDS
      matric:
        raw["Matric"] ||
        raw["Matric No"] ||
        raw["Student ID"] ||
        raw["StudentID"] ||
        "",

      name: raw["Student Name"] || "-",
      email: getStudentEmail(raw),
      programme: raw["Programme"] || "-",
      start_date: raw["Start Date"] || "-",
      field: raw["Field"] || "-",
      department: raw["Department"] || "-",

      supervisor: raw["Main Supervisor"] || "-",
      cosupervisor:
        raw["Co-Supervisor(s)"] ||
        raw["Co Supervisor"] ||
        raw["Co-supervisor"] ||
        "-",

      supervisorEmail: raw["Main Supervisor's Email"] || "-",

      // Progress
      progress: progressPercent,

      rowNumber,
      timeline
    });
  } catch (err) {
    console.error("supervisor/student error:", err);
    return res.status(500).json({ error: err.message });
  }
});
