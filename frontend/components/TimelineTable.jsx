// components/TimelineTable.jsx
function daysLeft(expectedDateStr) {
  if (!expectedDateStr) return null;
  const expected = new Date(expectedDateStr);
  if (isNaN(expected)) return null;
  const now = new Date();
  const diff = Math.ceil((expected - now) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function TimelineTable({ rows = [], supervisor }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead>
          <tr>
            <th className="py-2 text-sm font-semibold text-purple-700">Milestone</th>
            <th className="py-2 text-sm font-semibold text-purple-700">Expected</th>
            <th className="py-2 text-sm font-semibold text-purple-700">Actual</th>
            <th className="py-2 text-sm font-semibold text-purple-700">Status</th>
            <th className="py-2 text-sm font-semibold text-purple-700">Remaining</th>
            <th className="py-2 text-sm font-semibold text-purple-700">Supervisor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const left = daysLeft(r.expected);
            let status = "Pending";
            if (r.actual) {
              // if actual provided, check on time vs late (simple compare)
              if (!r.expected) status = "Submitted";
              else {
                const expectedDate = new Date(r.expected);
                const actualDate = isNaN(Date.parse(r.actual)) ? null : new Date(r.actual);
                // If actual is not a full date string, assume on-time if value exists
                if (actualDate && expectedDate) status = actualDate <= expectedDate ? "On Time" : "Late";
                else status = "Submitted";
              }
            } else {
              status = left === null ? "Pending" : (left >= 0 ? "On Time" : "Overdue");
            }

            const expectedLabel = r.expected ? (new Date(r.expected)).toLocaleDateString() : "—";
            const actualLabel = r.actual || "—";
            const remainingLabel = left === null ? "—" : (left < 0 ? `${Math.abs(left)}d overdue` : `${left}d`);
            return (
              <tr key={r.label} className="border-t">
                <td className="py-3 font-medium">{r.label}</td>
                <td className="py-3">{expectedLabel}</td>
                <td className="py-3">{actualLabel}</td>
                <td className="py-3">{status}</td>
                <td className="py-3">{remainingLabel}</td>
                <td className="py-3">{supervisor || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
