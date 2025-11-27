// components/TimelineTable.jsx
function formatDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString();
  } catch (e) {
    return d;
  }
}

function remainingDaysStr(expected) {
  if (!expected) return "—";
  const now = new Date();
  const e = new Date(expected);
  if (isNaN(e)) return "—";
  const diff = Math.ceil((e - now) / (1000 * 60 * 60 * 24));
  if (diff > 0) return `${Math.abs(diff)}d remaining`;
  return `${Math.abs(diff)}d overdue`;
}

export default function TimelineTable({ rows = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="text-left text-sm text-slate-700">
            <th className="py-2 pr-4">Milestone</th>
            <th className="py-2 pr-4">Expected</th>
            <th className="py-2 pr-4">Actual</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Remaining</th>
            <th className="py-2 pr-4">Supervisor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const actualStatus = r.actual ? "Submitted" : "Pending";
            return (
              <tr key={r.label} className="border-t border-gray-100">
                <td className="py-3 text-sm">{r.label}</td>
                <td className="py-3 text-sm">{formatDate(r.expected)}</td>
                <td className="py-3 text-sm">{r.actual || "—"}</td>
                <td className="py-3 text-sm">{actualStatus}</td>
                <td className="py-3 text-sm">{remainingDaysStr(r.expected)}</td>
                <td className="py-3 text-sm">{r.supervisor || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
