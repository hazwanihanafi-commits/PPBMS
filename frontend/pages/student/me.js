import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function StudentCleanView() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) return (window.location.href = "/login");
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const r = await fetch(`${API}/api/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      setRow(data.row);
    })();
  }, [token]);

  if (!row)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 text-lg">
        Loading…
      </div>
    );

  const milestones = [
    "P1 Submitted",
    "P1 Approved",
    "P3 Submitted",
    "P3 Approved",
    "P4 Submitted",
    "P4 Approved",
    "P5 Submitted",
    "P5 Approved",
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-8">
        
        {/* Header */}
        <h1 className="text-2xl font-semibold text-gray-800 text-center mb-2">
          Student Progress Overview
        </h1>

        <p className="text-center text-gray-600 mb-6">
          {row.student_name} — {row.programme}
        </p>

        {/* Supervisor */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-gray-500">Supervisor</p>
          <p className="text-lg font-medium text-purple-700">
            {row.main_supervisor}
          </p>
        </div>

        {/* Milestones */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Milestone Status
          </h2>

          <div className="space-y-3">
            {milestones.map((m) => (
              <div
                key={m}
                className="flex justify-between bg-gray-50 p-3 rounded-lg border"
              >
                <span>{m}</span>
                <span className="font-medium text-gray-700">
                  {row.raw[m] || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <button
            onClick={() => (window.location.href = "/student/dashboard")}
            className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
          >
            Open Full Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
