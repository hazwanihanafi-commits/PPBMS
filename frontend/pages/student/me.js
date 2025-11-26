// frontend/pages/student/me.js
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

// Expected due dates
const DUE = {
  P1: "2024-08-31",
  P3: "2025-01-31",
  P4: "2025-02-15",
  P5: "2025-10-01",
};

// ---------- Status Calculation ----------
function computeStatus(expected, actual) {
  if (!expected) return "No Data";
  if (!actual) {
    const today = new Date();
    if (today > new Date(expected)) return "Overdue";
    return "Pending";
  }
  return new Date(actual) <= new Date(expected) ? "On Time" : "Late";
}

// ---------- Milestone progress value (0–100%) ----------
function milestoneProgress(expected, actual) {
  if (!actual) return 0;
  return 100;
}

export default function StudentMe() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) window.location.href = "/login";
    else setToken(t);
  }, []);

  // Fetch user data
  useEffect(() => {
    if (!token) return;
    (async () => {
      const r = await fetch(`${API}/api/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      setRow(data.row);
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (!row) return null;

  const raw = row.raw;

  // Completed %
  const completed = ["P1", "P3", "P4", "P5"].filter(
    p => raw[`${p} Submitted`]
  ).length;
  const percentage = Math.round((completed / 4) * 100);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* HEADER GRADIENT */}
      <div
        className="text-center text-white py-10 font-bold text-3xl"
        style={{
          background: "linear-gradient(to right, #6A0DAD, #C13584, #E65C00)",
        }}
      >
        PPBMS Student Progress
      </div>

      {/* PROFILE CARD */}
      <div className="mx-4 mt-4 bg-white rounded-3xl shadow-xl p-6">
        <div className="text-2xl font-bold">
          {row.student_name} — {row.programme}
        </div>

        <div className="text-purple-700 mt-2 font-semibold">
          Status: {row.raw["Status P"] || "—"}
        </div>

        <div className="mt-3">
          <div className="font-semibold">Supervisor:</div>
          <div>{row.main_supervisor}</div>

          <div className="font-semibold mt-2">Email:</div>
          <div>{row.student_email}</div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="mx-4 mt-6 bg-white rounded-3xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-purple-700 mb-4">Summary</h2>

        <div className="font-semibold text-lg">
          Milestones Completed:{" "}
          <span className="text-purple-700">{completed} / 4</span>
        </div>

        <div className="font-semibold text-lg mt-2">
          Last Submission:{" "}
          <span className="text-purple-700">
            {raw["P5 Submitted"] ||
              raw["P4 Submitted"] ||
              raw["P3 Submitted"] ||
              raw["P1 Submitted"] ||
              "—"}
          </span>
        </div>

        {/* Circular Progress Chart */}
        <div className="flex justify-center mt-6">
          <svg width="140" height="140">
            <circle
              cx="70"
              cy="70"
              r="60"
              stroke="#EEE"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="70"
              cy="70"
              r="60"
              stroke="url(#grad)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${(percentage / 100) * 377} 377`}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
            />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6A0DAD" />
                <stop offset="50%" stopColor="#C13584" />
                <stop offset="100%" stopColor="#E65C00" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="text-center text-purple-700 font-bold text-xl mt-2">
          {percentage}%
        </div>
      </div>

      {/* EXPECTED VS ACTUAL TABLE */}
      <div className="mx-4 mt-6 bg-white rounded-3xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-purple-700 mb-4">
          Expected vs Actual Timeline
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full border-collapse">
            <thead>
              <tr
                className="text-white"
                style={{
                  background:
                    "linear-gradient(to right, #6A0DAD, #C13584, #E65C00)",
                }}
              >
                <th className="p-3 text-left font-semibold">Milestone</th>
                <th className="p-3 text-left font-semibold">Expected</th>
                <th className="p-3 text-left font-semibold">Actual</th>
                <th className="p-3 text-left font-semibold">Status</th>
                <th className="p-3 text-left font-semibold">Progress</th>
              </tr>
            </thead>

            <tbody>
              {["P1", "P3", "P4", "P5"].map(p => {
                const expected = DUE[p];
                const actual = raw[`${p} Submitted`] || "—";
                const status = computeStatus(expected, raw[`${p} Submitted`]);
                const prog = milestoneProgress(expected, raw[`${p} Submitted`]);

                const badgeColor =
                  status === "On Time"
                    ? "bg-green-100 text-green-700"
                    : status === "Late"
                    ? "bg-yellow-100 text-yellow-700"
                    : status === "Overdue"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-200 text-gray-700";

                return (
                  <tr key={p} className="border-b border-gray-200">
                    <td className="p-3 font-semibold text-gray-800">{p}</td>
                    <td className="p-3">{expected}</td>
                    <td className="p-3">{actual}</td>

                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="p-3 w-32">
                      <div className="h-3 bg-gray-200 rounded-full">
                        <div
                          className="h-3 rounded-full"
                          style={{
                            width: `${prog}%`,
                            background:
                              "linear-gradient(to right, #6A0DAD, #C13584, #E65C00)",
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
