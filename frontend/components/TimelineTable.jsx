import React from "react";

function isSubmittedValue(val) {
  if (val === null || val === undefined) return false;
  const s = String(val).trim().toLowerCase();
  if (!s) return false;
  if (["", "n/a", "#n/a", "—", "-", "na"].includes(s)) return false;
  return true;
}

function daysOverdue(expected) {
  if (!expected) return null;
  const today = new Date();
  const exp = new Date(String(expected));
  if (isNaN(exp.getTime())) return null;
  const diff = Math.floor((today - exp) / (1000 * 60 * 60 * 24));
  return diff > 0 ? `${diff}d overdue` : `${Math.abs(diff)}d remaining`;
}

export default function TimelineTable({ rows = [] }) {
  if (!rows || rows.length === 0) return null;

  return (
    <table className="w-full border-collapse mt-3">
      <thead>
        <tr className="bg-gradient-to-r from-purple-600 to-pink-500 text-white">
          <th className="p-3 text-left">Activity</th>
          <th className="p-3 text-left">Expected</th>
          <th className="p-3 text-left">Actual</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-left">Remaining</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((r, idx) => {
          const submitted = isSubmittedValue(r.actual);
          const remainingText = r.expected ? daysOverdue(r.expected) : null;

          return (
            <tr key={`${r.activity}-${idx}`} className="border-b">
              <td className="p-3 align-top">
                <div className="font-semibold">{r.activity}</div>
                <div className="text-xs text-gray-500">{r.milestone}</div>
              </td>

              <td className="p-3 align-top">{r.expected ? String(r.expected).split("T")[0] : "—"}</td>
              <td className="p-3 align-top">{submitted ? String(r.actual) : "—"}</td>

              <td className="p-3 align-top">
                {submitted ? (
                  <span className="text-green-600 font-semibold">Submitted</span>
                ) : (
                  <span className="text-orange-600 font-semibold">Pending</span>
                )}
              </td>

              <td className="p-3 align-top">
                {remainingText ? (
                  <span className={`text-sm px-3 py-1 rounded ${remainingText.includes("overdue") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {remainingText}
                  </span>
                ) : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
