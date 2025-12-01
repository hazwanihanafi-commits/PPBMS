// frontend/components/TimelineTable.jsx
import React from "react";

export default function TimelineTable({ rows = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="text-left">
            <th className="p-2">Activity</th>
            <th className="p-2">Expected</th>
            <th className="p-2">Actual</th>
            <th className="p-2">Status</th>
            <th className="p-2">Remaining (days)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.activity} className="border-t">
              <td className="p-2">{t.activity}</td>
              <td className="p-2">{t.expected || "-"}</td>
              <td className="p-2">{t.actual || "-"}</td>
              <td className={`p-2 ${t.status === "Late" ? "text-red-600" : t.status === "Completed" ? "text-green-600" : "text-yellow-600"}`}>
                {t.status}
              </td>
              <td className="p-2">{t.remaining === null || t.remaining === undefined ? "-" : t.remaining}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
