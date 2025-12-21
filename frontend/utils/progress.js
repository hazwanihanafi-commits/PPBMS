export function calculateProgress(timeline = []) {
  if (!timeline.length) return 0;

  const completed = timeline.filter(t => t.status === "Completed").length;
  return Math.round((completed / timeline.length) * 100);
}
