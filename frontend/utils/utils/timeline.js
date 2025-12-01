export function buildExpectedTimeline(startDate, programme) {
  const start = new Date(startDate);
  const addMonths = (m) => new Date(start.getFullYear(), start.getMonth() + m, start.getDate())
    .toISOString().slice(0, 10);

  if (programme.toLowerCase().includes("msc")) {
    return {
      "Development Plan & Learning Contract": addMonths(2),
      "Annual Progress Review (Year 1)": addMonths(12),
      "Final Progress Review / Internal Evaluation": addMonths(24),
      "Thesis Draft Completed": addMonths(20),
      "Final Thesis Submission": addMonths(24)
    };
  }

  // PhD — 3 years
  return {
    "Development Plan & Learning Contract": addMonths(2),
    "Annual Progress Review (Year 1)": addMonths(12),
    "Annual Progress Review (Year 2)": addMonths(24),
    "Final Progress Review / Internal Evaluation": addMonths(36),
    "Thesis Draft Completed": addMonths(30),
    "Final Thesis Submission": addMonths(36)
  };
}
