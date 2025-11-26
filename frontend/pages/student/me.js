import { useEffect, useState } from "react";

/* ----------------------------- CONFIG ----------------------------- */
const API = process.env.NEXT_PUBLIC_API_BASE;

const DUE = {
  P1: "2024-08-31",
  P3: "2025-01-31",
  P4: "2025-02-15",
  P5: "2025-10-01",
};

/* ----------------------------- MAIN PAGE ----------------------------- */

export default function StudentDashboard() {
  const [token, setToken] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Load token */
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) window.location.href = "/login";
    else setToken(t);
  }, []);

  /* Fetch student row */
  useEffect(() => {
    if (!token) return;
    (async () => {
      const r = await fetch(`${API}/api/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      setData(j.row);
      setLoading(false);
    })();
  }, [token]);

  if (loading || !data)
    return <div className="p-6 text-center text-lg">Loading…</div>;

  const row = data;
  const raw = row.raw;

  /* Progress */
  const submitted = [
    raw["P1 Submitted"],
    raw["P3 Submitted"],
    raw["P4 Submitted"],
    raw["P5 Submitted"],
  ].filter(Boolean).length;

  const percentage = Math.round((submitted / 4) * 100);

  /* Status color */
  const STATUS_COLOR = {
    Completed: "bg-green-600",
    "In Progress": "bg-blue-600",
    Pending: "bg-gray-500",
    Overdue: "bg-red-600",
  };

  const currentStatus = row.raw["Status P"] || "Pending";

  /* Expected vs Actual Helper */
  const getStatus = (milestone) => {
    const due = new Date(DUE[milestone]);
    const today = new Date();
    const actual = raw[`${milestone} Submitted`];

    if (!actual && today < due) return "Pending";
    if (!actual && today > due) return "Overdue";

    const diff = (new Date(actual) - due) / (1000 * 3600 * 24);
    return diff > 0 ? `Late (${diff.toFixed(0)} days)` : `On Time`;
  };

  /* ------------------------------- UI ------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50">

      {/* TOP GRADIENT HEADER */}
      <div className="w-full py-10 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-extrabold">PPBMS Student Progress</h1>
          <p className="text-lg opacity-90 mt-1">{row.student_name} — {row.programme}</p>
        </div>
      </div>

      {/* MAIN WRAPPER */}
      <div className="max-w-5xl mx-auto p-6 space-y-8">

        {/* STATUS BADGE */}
        <div className="flex justify-end">
          <div className={`px-4 py-2 rounded-full text-white text-sm font-semibold shadow ${STATUS_COLOR[currentStatus]}`}>
            {currentStatus}
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-purple-700 mb-2">Summary</h2>
          <p className="text-gray-700"><strong>Supervisor:</strong> {row.main_supervisor}</p>
          <p className="text-gray-700 mt-1"><strong>Email:</strong> {row.student_email}</p>

          {/* Progress circle */}
          <div className="mt-6 flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="54" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  stroke="url(#grad)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={339.292}
                  strokeDashoffset={339.292 - (339.292 * percentage) / 100}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="50%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-purple-700">
                {percentage}%
              </div>
            </div>
          </div>
        </div>

        {/* EXPECTED vs ACTUAL */}
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-purple-700 mb-4">Expected vs Actual Timeline</h2>

          {["P1", "P3", "P4", "P5"].map((p) => (
            <div key={p} className="border-b pb-3 mb-3">
              <p className="font-bold text-gray-900">{p}</p>
              <p className="text-gray-700">Expected: {DUE[p]}</p>
              <p className="text-gray-700">Actual: {raw[`${p} Submitted`] || "—"}</p>
              <p className="text-gray-700 font-semibold">Status: {getStatus(p)}</p>
            </div>
          ))}
        </div>

        {/* GANTT CHART */}
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-purple-700 mb-4">Timeline Gantt Chart</h2>

          {["P1", "P3", "P4", "P5"].map((p) => (
            <div key={p} className="mb-6">
              <p className="font-semibold text-gray-800 mb-1">{p}</p>

              <div className="h-3 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 w-full"></div>

              {raw[`${p} Submitted`] ? (
                <div className="h-3 rounded-full bg-black mt-1 w-full opacity-60"></div>
              ) : (
                <p className="text-xs text-gray-600 mt-1">Not submitted</p>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
