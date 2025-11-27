// components/TimelineTable.jsx
// rows: [{ label, expected, actual }]
function formatDateISOToDisplay(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString();
  } catch {
    return d;
  }
}

function daysDiffFromToday(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  // round to days
  const diffMs = Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / (1000 * 60 * 60 * 24));
  return diffMs; // positive -> overdue days, negative -> days left (abs)
}

export default function TimelineTable({ rows = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="text-left text-sm text-slate-700">
            <th className="pb-3 pr-6">Milestone</th>
            <th className="pb-3 pr-6">Expected</th>
            <th className="pb-3 pr-6">Actual</th>
            <th className="pb-3 pr-6">Status</th>
            <th className="pb-3 pr-6">Remaining</th>
            <th className="pb-3 pr-6">Supervisor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const expectedISO = r.expected ? new Date(r.expected).toISOString() : null;
            const actualPresent = !!r.actual;
            const diff = daysDiffFromToday(r.expected);
            let status = "Pending";
            if (actualPresent) status = "Submitted";
            else if (r.expected) {
              const dt = new Date(r.expected);
              if (Date.now() > dt.getTime()) status = "Overdue";
            }

            let remainingText = "—";
            if (diff !== null) {
              if (actualPresent) {
                const abs = Math.abs(diff);
                remainingText = diff > 0 ? `${abs}d overdue` : `${Math.abs(diff)}d left`;
              } else {
                // not submitted yet
                remainingText = diff > 0 ? `${diff}d overdue` : `${Math.abs(diff)}d left`;
              }
            }

            return (
              <tr key={idx} className="align-top border-t border-slate-100">
                <td className="py-4 pr-6">{r.label}</td>
                <td className="py-4 pr-6">{r.expected ? formatDateISOToDisplay(r.expected) : "—"}</td>
                <td className="py-4 pr-6">{r.actual || "—"}</td>
                <td className="py-4 pr-6">
                  <span className={
                    "inline-block px-2 py-1 rounded-full text-xs font-medium " +
                    (status === "Submitted" ? "bg-green-100 text-green-700" :
                     status === "Overdue" ? "bg-red-100 text-red-700" :
                     "bg-gray-100 text-gray-700")
                  }>
                    {status}
                  </span>
                </td>
                <td className="py-4 pr-6">
                  <div className="text-sm">
                    <span className="inline-block px-2 py-1 rounded-md bg-white text-sm text-slate-700 shadow-sm">
                      {remainingText}
                    </span>
                  </div>
                </td>
                <td className="py-4 pr-6 text-sm text-slate-800">hazwanihanafi@usm.my</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
