export default function TimelineTable({ rows = [] }) {
  const badge = (status) => {
    const base =
      "px-3 py-1 rounded-full text-xs font-semibold tracking-wide";

    switch (status) {
      case "Completed":
        return <span className={`${base} bg-green-100 text-green-700`}>Completed</span>;
      case "On track":
        return <span className={`${base} bg-blue-100 text-blue-700`}>On Track</span>;
      case "Due soon":
        return <span className={`${base} bg-yellow-100 text-yellow-800`}>Due Soon</span>;
      case "Delayed":
        return <span className={`${base} bg-red-100 text-red-700`}>Delayed</span>;
      default:
        return <span className={`${base} bg-gray-100 text-gray-600`}>—</span>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-purple-600 text-white text-left">
          <tr>
            <th className="py-3 px-4 font-semibold">Activity</th>
            <th className="py-3 px-4 font-semibold">Expected</th>
            <th className="py-3 px-4 font-semibold">Actual</th>
            <th className="py-3 px-4 font-semibold">Status</th>
            <th className="py-3 px-4 font-semibold text-right">Remaining</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 bg-white">
          {rows.map((r) => (
            <tr key={r.key} className="hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-800 w-56">{r.label || r.key}</td>
              <td className="py-3 px-4 text-gray-600">{r.expected}</td>
              <td className="py-3 px-4 text-gray-600">{r.actual}</td>
              <td className="py-3 px-4">{badge(r.status)}</td>
              <td className="py-3 px-4 text-right text-gray-700">{r.remaining}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
