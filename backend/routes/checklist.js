router.get("/", auth, async (req, res) => {
  const email =
    req.user.role === "supervisor"
      ? req.query.studentEmail
      : req.user.email;

  const checklist = await getChecklistRow(
    process.env.MASTER_TRACKING_SHEET_ID,
    email
  );

  res.json({ role: req.user.role, checklist });
});
