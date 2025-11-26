// frontend/components/GanttTimeline.jsx
import { parseISO, differenceInDays } from "date-fns";

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

export default function GanttTimeline({ raw = {}, dueMap = {} }) {
  // landmarks for axis (min -> max)
  // convert due map to date objects
  const tasks = [
    { key: "P1 Submitted", label: "P1" },
    { key: "P3 Submitted", label: "P3" },
    { key: "P4 Submitted", label: "P4" },
    { key: "P5 Submitted", label: "P5" },
  ];

  const dates = tasks.map(t => {
    const d = raw[t.key] || null;
    return d ? new Date(d) : null;
  }).filter(Boolean);

  const dueDates = tasks.map(t => dueMap[t.key] ? new Date(dueMap[t.key]) : null).filter(Boolean);

  const allDates = [...dates, ...dueDates];
  if (allDates.length === 0) return <div className="text-gray-500">No timeline available</div>;

  const min = new Date(Math.min(...allDates.map(d=>d.getTime())));
  const max = new Date(Math.max(...allDates.map(d=>d.getTime())));
  const totalDays = Math.max(30, differenceInDays(max, min) || 30);

  const row = (taskKey) => {
    const start = raw[taskKey] ? new Date(raw[taskKey]) : null;
    const due = dueMap[taskKey] ? new Date(dueMap[taskKey]) : null;
    const submitted = start ? true : false;
    const leftPercent = start ? clamp(differenceInDays(start, min) / totalDays * 100, 0, 100) : 0;
    const widthPercent = submitted ? 6 : 0; // small dot / bar
    return { leftPercent, widthPercent, due, submitted };
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-2">Gantt-style Timeline (approx)</div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        {tasks.map((t) => {
          const r = row(t.key);
          const isLate = r.due && r.submitted && (new Date(r.due).getTime() < new Date(raw[t.key]).getTime());
          const badge = !r.submitted && r.due && (new Date() > r.due) ? "late" : isLate ? "late-submitted" : "ok";

          return (
            <div key={t.key} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium">{t.label}</div>
                <div className="text-xs text-gray-500">
                  {raw[t.key] || (r.due ? `Due ${r.due.toLocaleDateString()}` : "—")}
                </div>
              </div>

              <div className="relative h-6 bg-gray-50 rounded-md border border-gray-100">
                {/* due marker */}
                {r.due && (
                  <div
                    title={`Due ${r.due.toLocaleDateString()}`}
                    className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
                    style={{ left: `${clamp(differenceInDays(r.due, min) / totalDays * 100, 0, 100)}%` }}
                  />
                )}

                {/* submitted dot */}
                {r.submitted && (
                  <div
                    className={`absolute top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full ${isLate ? "bg-red-500" : "bg-green-500"} shadow`}
                    style={{ left: `${r.leftPercent}%` }}
                  />
                )}

                {/* label for missing */}
                {!r.submitted && r.due && new Date() > r.due && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-600 font-semibold">Late</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
