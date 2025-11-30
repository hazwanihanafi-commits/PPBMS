// frontend/components/TimelineTable.jsx
import React from "react";

function daysBetween(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const diff = Math.ceil((d - new Date()) / (1000*60*60*24));
  return diff;
}

export default function TimelineTable({ rows = [] }) {
  if (!rows || rows.length === 0) return null;

  function statusOf(r) {
    if (r.actual && r.actual !== "") return "Completed";
    if (!r.expected) return "No target";
    const remaining = daysBetween(r.expected);
    if (remaining === null) return "Pending";
    if (remaining < 0) return "Delayed";
    if (remaining <= 14) return "Due soon";
    return "On Track";
  }

  return (
    <table className="w-full border-collapse mt-3">
      <thead>
        <tr className="bg-purple-600 text-white">
          <th className="p-2 text-left">Activity</th>
          <th className="p-2 text-left">Expected</th>
          <th className="p-2 text-left">Actual</th>
          <th className="p-2 text-left">Status</th>
          <th className="p-2 text-left">Remaining</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => {
          const st = statusOf(r);
          const rem = r.expected ? daysBetween(r.expected) : null;
          return (
            <tr key={idx} className="border-b">
              <td className="p-2">{r.definition || r.activity || r.milestone}</td>
              <td className="p-2">{r.expected || "—"}</td>
              <td className="p-2">{r.actual || "—"}</td>
              <td className="p-2 font-semibold">{st}</td>
              <td className="p-2">
                {rem === null ? "—" : (rem < 0 ? `${Math.abs(rem)}d overdue` : `${rem}d`)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
