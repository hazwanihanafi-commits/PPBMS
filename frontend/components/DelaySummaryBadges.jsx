export default function DelaySummaryBadges({ timeline = [] }) {
  const completed = timeline.filter(t => t.status === "Completed").length;
  const delayed = timeline.filter(
    t => !t.actual && t.remaining_days < 0
  ).length;
  const pending = timeline.length - completed - delayed;

  return (
    <div className="flex flex-wrap gap-4 mt-4">
      {/* Completed */}
      <div className="px-4 py-2 rounded-xl bg-green-100 text-green-700 font-semibold text-sm">
        ✅ Completed: {completed}
      </div>

      {/* Pending */}
      <div className="px-4 py-2 rounded-xl bg-yellow-100 text-yellow-700 font-semibold text-sm">
        ⏳ Pending: {pending}
      </div>

      {/* Delayed */}
      <div className="px-4 py-2 rounded-xl bg-red-100 text-red-700 font-semibold text-sm">
        ⚠️ Delayed: {delayed}
      </div>
    </div>
  );
}
