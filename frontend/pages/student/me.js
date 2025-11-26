// frontend/pages/student/me.js

import { useEffect, useState } from "react";
import { Chart } from "react-google-charts";

const API = process.env.NEXT_PUBLIC_API_BASE;

// Expected milestone dates
const EXPECTED = {
  P1: "2024-08-31",
  P3: "2025-01-31",
  P4: "2025-02-15",
  P5: "2025-10-01",
};

// Activity → Milestone mapping
const ACTIVITY_MAP = [
  ["Registration", "P1"],
  ["Literature", "P3"],
  ["Proposal", "P3"],
  ["Ethics", "P3"],
  ["Pilot", "P4"],
  ["Implementation", "P4"],
  ["Mid-Candidature", "P5"],
  ["Seminar", "P5"],
  ["Publication", "P4"],
  ["Dissemination", "P4"],
  ["Thesis", "P5"],
  ["Pre-Submission", "P5"],
  ["Examination", "P5"],
];

export default function StudentProgress() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) window.location.href = "/login";
    setToken(t);
  }, []);

  // Load student data
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const r = await fetch(`${API}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await r.json();
        setRow(data.row);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [token]);

  if (!row)
    return <div className="p-6 text-center text-gray-500">Loading…</div>;

  // Calculate progress
  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(Boolean).length;

  const percentage = Math.round((completed / 4) * 100);

  // Donut chart data
  const donutData = [
    ["Task", "Completed"],
    ["Completed", completed],
    ["Remaining", 4 - completed],
  ];

  const donutOptions = {
    pieHole: 0.65,
    legend: "none",
    pieSliceText: "none",
    colors: ["#9C27B0", "#E0E0E0"],
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Gradient Header */}
      <div className="w-full py-6 px-6 text-white bg-gradient-to-r from-purple-600 via-purple-500 to-pink-400 shadow-md">
        <h1 className="text-3xl font-extrabold tracking-tight">
          PPBMS Student Progress
        </h1>
        <p className="text-lg mt-1 font-medium opacity-90">
          {row.student_name} — {row.programme}
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">

        {/* Summary card */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-2xl font-bold text-purple-700 mb-3">Summary</h2>

          <p><strong>Supervisor:</strong> {row.main_supervisor}</p>
          <p><strong>Email:</strong> {row.student_email}</p>

          <div className="flex items-center gap-6 mt-4">
            {/* Donut chart */}
            <div className="w-32 h-32">
              <Chart
                chartType="PieChart"
                data={donutData}
                options={donutOptions}
                width="100%"
                height="100%"
              />
            </div>

            <div className="text-2xl font-bold text-purple-600">
              {percentage}%  
              <p className="text-sm text-gray-600 font-medium">
                {completed} / 4 milestones
              </p>
            </div>
          </div>
        </div>

        {/* Expected vs Actual */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-2xl font-bold text-purple-700 mb-4">
            Expected vs Actual Timeline
          </h2>

          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-400 text-white">
              <tr>
                <th className="p-3">Milestone</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Actual</th>
                <th className="p-3">Status</th>
                <th className="p-3">Supervisor</th>
              </tr>
            </thead>
            <tbody>
              {["P1","P3","P4","P5"].map((m) => {
                const submitted = row.raw[`${m} Submitted`] || "—";
                const expected = EXPECTED[m];
                const status =
                  submitted === "—" ? "Pending" : "On Time";

                return (
                  <tr key={m} className="border-b">
                    <td className="p-3 font-semibold">{m}</td>
                    <td className="p-3">{expected}</td>
                    <td className="p-3">{submitted}</td>
                    <td className="p-3">{status}</td>
                    <td className="p-3">{row.main_supervisor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Activity Mapping */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-2xl font-bold text-purple-700 mb-4">
            Activity → Milestone Mapping
          </h2>

          <table className="w-full border-collapse text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 font-semibold">Activity</th>
                <th className="p-3 font-semibold">Milestone</th>
              </tr>
            </thead>
            <tbody>
              {ACTIVITY_MAP.map(([act, m]) => (
                <tr key={act} className="border-b">
                  <td className="p-3">{act}</td>
                  <td className="p-3 font-semibold text-purple-600">{m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
