export default function TimelineSummary({ timeline }) {
  const completed = timeline.filter(t => t.status === "Completed").length;

  const late = timeline.filter(
    t => !t.actual && t.remaining_days < 0 && t.status !== "Completed"
  ).length;

  const onTrack = timeline.length - completed - late;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-green-100 text-green-800 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold">{completed}</div>
        <div className="text-sm font-semibold">Completed</div>
      </div>

      <div className="bg-blue-100 text-blue-800 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold">{onTrack}</div>
        <div className="text-sm font-semibold">On Track</div>
      </div>

      <div className="bg-red-100 text-red-800 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold">{late}</div>
        <div className="text-sm font-semibold">Late</div>
      </div>
    </div>
  );
}
