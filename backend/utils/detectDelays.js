export function detectDelays(timeline) {
  return timeline.filter(item => {
    return (
      item.status !== "Completed" &&
      item.remaining_days < 0
    );
  });
}
