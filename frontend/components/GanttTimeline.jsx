// frontend/components/GanttTimeline.jsx
// A simple visual Gantt-like row for your four submitted milestones.
// Avoids external libs; it renders month-based bars between start/end / due dates.

function monthsBetween(a, b) {
  const A = new Date(a); const B = new Date(b);
  return (B.getFullYear() - A.getFullYear()) * 12 + (B.getMonth() - A.getMonth());
}

export default function GanttTimeline({ raw = {}, due = {} }) {
  // Build rows for P1,P3,P4,P5 using either submitted date or due date as marker.
  const items = [
    { key: "P1 Submitted", label: "P1" },
    { key: "P3 Submitted", label: "P3" },
    { key: "P4 Submitted", label: "P4" },
    { key: "P5 Submitted", label: "P5" },
  ];

  // Determine timeline range: earliest submission or default to now -6m, and end = max(due, now + 6m)
  const dates = items.flatMap(i => {
    const s = raw[i.key];
    const d = due[i.key];
    return [s, d].filter(Boolean);
  });

  const now = new Date();
  const parsed = dates.map(d => new Date(d));
  const min = parsed.length ? new Date(Math.min(...parsed)) : new Date(new Date().setMonth(now.getMonth() - 6));
  const max = parsed.length ? new Date(Math.max(...parsed)) : new Date(new Date().setMonth(now.getMonth() + 6));
  // pad range
  min.setMonth(min.getMonth() - 1);
  max.setMonth(max.getMonth() + 1);

  const totalMonths = monthsBetween(min, max) || 1;

  return (
    <div className="w-full">
      <div className="text-sm text-gray-600 mb-3">Timeline range: {min.toISOString().slice(0,10)} → {max.toISOString().slice(0,10)}</div>

      <div className="space-y-3">
        {items.map(it => {
          const submitted = raw[it.key] ? new Date(raw[it.key]) : null;
          const dueDate = due[it.key] ? new Date(due[it.key]) : null;

          // compute bar positions as percentage
          const start = submitted ? monthsBetween(min, submitted) : (dueDate ? monthsBetween(min, dueDate) : 0);
          const width = submitted ? 1 : (dueDate ? 0.2 : 0.05); // small marker if not submitted
          const leftPct = Math.max(0, Math.min(100, (start / totalMonths) * 100));
          const wPct = Math.max(1, Math.min(100, (width / totalMonths) * 100));

          return (
            <div key={it.key} className="flex items-center gap-4">
              <div className="w-14 text-sm">{it.label}</div>
              <div className="flex-1 bg-gray-50 rounded px-3 py-2 relative">
                {/* background months ticks */}
                <div className="absolute inset-0 flex">
                  {Array.from({length: Math.max(1, totalMonths)}).map((_,i)=>(
                    <div key={i} className="flex-1 border-r border-gray-100" />
                  ))}
                </div>

                {/* bar/marker */}
                <div style={{position:"relative", height:36}}>
                  <div style={{
                    position:"absolute",
                    left: `${leftPct}%`,
                    width: `${wPct}%`,
                    height: 14,
                    top: 10,
                    borderRadius: 8,
                    background: submitted ? "linear-gradient(90deg,#60a5fa,#7c3aed)" : "#fde68a",
                    boxShadow: submitted ? "0 4px 12px rgba(124,58,237,0.08)" : "none",
                    transform: "translateX(-8px)"
                  }} />
                  {/* label */}
                  <div style={{position:"absolute", left:`${leftPct}%`, top: -6, transform:"translateX(-8px)"}}>
                    <div className="text-xs font-medium">
                      {submitted ? `Submitted ${submitted.toISOString().slice(0,10)}` : (dueDate ? `Due ${dueDate.toISOString().slice(0,10)}` : "No date")}
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-28 text-sm text-right">
                {submitted ? <span className="text-green-700">Done</span> : (dueDate ? <span className="text-red-600">Due</span> : <span className="text-gray-500">TBD</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
