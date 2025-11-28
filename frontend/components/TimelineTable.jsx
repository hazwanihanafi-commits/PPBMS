import React from "react";

export default function TimelineTable({ rows = [] }) {
  if (!rows || rows.length === 0) return null;

  function daysOverdue(expected) {
    if (!expected) return null;
    const today = new Date();
    const exp = new Date(expected);
    const diff = Math.floor((today - exp) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}d overdue` : `${Math.abs(diff)}d remaining`;
  }

  return (
    <table className="w-full border-collapse mt-3">
      <thead>
        <tr className="bg-purple-500 text-white">
          <th className="p-2 text-left">Milestone</th>
          <th className="p-2 text-left">Expected</th>
          <th className="p-2 text-left">Actual</th>
          <th className="p-2 text-left">Status</th>
          <th className="p-2 text-left">Remaining</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((r) => (
          <tr key={r.milestone} className="border-b">
            
            {/* Milestone definition */}
            <td className="p-2">
              {r.definition || r.milestone}
            </td>

            {/* Expected */}
            <td className="p-2">{r.expected}</td>

            {/* Actual */}
            <td className="p-2">{r.actual || "—"}</td>

            {/* Status */}
            <td className="p-2">
              {r.actual ? (
                <span className="text-green-600 font-semibold">Submitted</span>
              ) : (
                <span className="text-red-500 font-semibold">Pending</span>
              )}
            </td>

            {/* Remaining/Overdue Badge */}
            <td className="p-2">
              {r.expected && (
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    daysOverdue(r.expected).includes("overdue")
                      ? "bg-red-200 text-red-700"
                      : "bg-green-200 text-green-700"
                  }`}
                >
                  {daysOverdue(r.expected)}
                </span>
              )}
            </td>

          </tr>
        ))}
      </tbody>
    </table>
  );
}
