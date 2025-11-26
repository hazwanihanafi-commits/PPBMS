// components/ProgressTable.jsx
import React from "react";

export default function ProgressTable({ students }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow mt-10">
      <h3 className="text-xl font-semibold mb-4">Student Progress Overview</h3>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left text-sm text-gray-600">
            <th className="p-2">Student</th>
            <th className="p-2">% Completed</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>

        <tbody>
          {students.map((s, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{s.name}</td>

              <td className="p-2">
                <div className="w-full bg-gray-200 h-3 rounded">
                  <div
                    className="bg-purple-500 h-3 rounded"
                    style={{ width: `${(s.completed / 4) * 100}%` }}
                  ></div>
                </div>
              </td>

              <td className="p-2">
                <span
                  className={`px-3 py-1 text-xs rounded-full ${
                    s.status === "Ahead"
                      ? "bg-green-100 text-green-700"
                      : s.status === "On Track"
                      ? "bg-blue-100 text-blue-700"
                      : s.status === "At Risk"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {s.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
