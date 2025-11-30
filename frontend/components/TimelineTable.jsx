export default function TimelineTable({ rows = [] }) {
  const badge = (status) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-semibold";

    if (status === "Completed") {
      return <span className={`${baseClasses} bg-green-100 text-green-700`}>{status}</span>;
    }
    if (status === "On track") {
      return <span className={`${baseClasses} bg-blue-100 text-blue-700`}>{status}</span>;
    }
    if (status === "Due soon") {
      return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>{status}</span>;
    }
    if (status === "Delayed") {
      return <span className={`${baseClasses} bg-red-100 text-red-700`}>{status}</span>;
    }

    // default / blank
    return <span className={`${baseClasses} bg-gray-100 text-gray-600`}>—</span>;
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
              <td className="py-3 px-4 font-medium text-gray-800 w-56">
                {r.label || r.key}
              </td>

              <td className="py-3 px-4 text-gray-600">{r.expected}</td>
              <td className="py-3 px-4 text-gray-600">{r.actual}</td>

              <td className="py-3 px-4">{badge(r.status)}</td>

              <td className="py-3 px-4 text-right text-gray-700">
                {r.remaining}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
