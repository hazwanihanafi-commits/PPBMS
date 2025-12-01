export function calculateProgress(rawRow, programmeText) {
  const startDate = rawRow["Start Date"];
  const isMsc = programmeText.toLowerCase().includes("msc");
  const plan = isMsc ? MSC_PLAN : PHD_PLAN;

  const itemsWithStatus = plan.map(item => {
    const actual = rawRow[item.key] || "";  
    const expected = autoExpectedDate(startDate, item.offset);

    let status = "Pending";
    if (actual) status = "Completed";
    else {
      const today = new Date().toISOString().slice(0, 10);
      if (expected < today) status = "Late";
    }

    return {
      ...item,
      expected,
      actual,
      status,
      remaining: actual ? "—" : "Due: " + expected
    };
  });

  const done = itemsWithStatus.filter(i => i.actual).length;

  return {
    percentage: Math.round((done / plan.length) * 100),
    done,
    total: plan.length,
    items: itemsWithStatus
  };
}
