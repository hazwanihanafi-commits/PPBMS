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
        <tr className="bg-gradient-to-r from-[#7c3aed] to-[#ec4899] text-white">
          <th className="p-3 text-left">Milestone</th>
          <th className="p-3 text-left">Expected</th>
          <th className="p-3 text-left">Actual</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-left">Remaining</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((r) => (
          <tr key={r.milestone} className="border-b">
            <td className="p-3">{r.definition || r.milestone}</td>
            <td className="p-3">{r.expected || "—"}</td>
            <td className="p-3">{r.actual || "—"}</td>
            <td className="p-3">
              {r.actual ? <span className="text-green-600 font-semibold">Submitted</span> : <span className="text-orange-600 font-semibold">Pending</span>}
            </td>
            <td className="p-3">
              {r.expected && (
                <span className={`text-sm px-3 py-1 rounded ${daysOverdue(r.expected).includes("overdue") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
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
