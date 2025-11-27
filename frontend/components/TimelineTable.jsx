// components/TimelineTable.jsx
import React from "react";

/**
 * rows: [{ label, expected (YYYY-MM-DD|null), actual (string|null) }]
 * supervisor: string
 */
function daysBetween(dateString) {
  if (!dateString) return null;
  const today = new Date();
  const target = new Date(dateString + "T00:00:00"); // treat as midnight local
  const diff = Math.floor((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function TimelineTable({ rows = [], supervisor = "—" }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-sm text-purple-800">
            <th className="pb-2">Milestone</th>
            <th className="pb-2">Expected</th>
            <th className="pb-2">Actual</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Remaining</th>
            <th className="pb-2">Supervisor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const remaining = daysBetween(r.expected);
            let status = "Pending";
            if (r.actual) status = "Submitted";
            else if (!r.expected) status = "No due date";

            // human-friendly remaining display
            let remainingText = "—";
            if (remaining !== null && remaining !== undefined) {
              if (remaining > 0) remainingText = `${remaining}d`;
              else if (remaining === 0) remainingText = `0d (today)`;
              else remainingText = `${Math.abs(remaining)}d overdue`;
            }

            return (
              <tr key={r.label} className="align-top border-t">
                <td className="py-3 pr-4 font-medium">{r.label}</td>
                <td className="py-3 pr-4 text-sm text-gray-700">{r.expected || "—"}</td>
                <td className="py-3 pr-4 text-sm text-gray-700">{r.actual || "—"}</td>
                <td className="py-3 pr-4 text-sm">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${status === "Submitted" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-sm text-gray-700">{remainingText}</td>
                <td className="py-3 text-sm text-gray-700">{supervisor}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
