// frontend/pages/admin/index.js

import { useState } from "react";
import { API_BASE } from "../../utils/api";

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ======================================================
     LOAD ALL STUDENTS
  ====================================================== */
  async function loadStudents() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/all-students`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("ppbms_token")}` }
      });

      const data = await res.json();

      if (!res.ok) setError(data.error || "Failed to load students");
      else setStudents(data.students);
    } catch {
      setError("Unable to load students");
    }

    setLoading(false);
  }

  /* ======================================================
     LOAD AT-RISK STUDENTS
  ====================================================== */
  async function loadAtRisk() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/at-risk`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("ppbms_token")}` }
      });

      const data = await res.json();

      if (!res.ok) setError(data.error || "Failed to load at-risk students");
      else setAtRisk(data.atRisk);
    } catch {
      setError("Unable to load at-risk students");
    }

    setLoading(false);
  }

  /* ======================================================
     RESET GOOGLE SHEET CACHE
  ====================================================== */
  async function resetCache() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/reset-cache`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("ppbms_token")}` }
      });

      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to reset cache");
      else alert("Google Sheet cache cleared successfully!");
    } catch {
      setError("Unable to reset cache");
    }

    setLoading(false);
  }

  /* ======================================================
     PAGE UI STARTS HERE
  ====================================================== */
  return (
    <div className="p-10 max-w-6xl mx-auto">

      {/* HEADER */}
      <h1 className="text-4xl font-bold text-purple-700 mb-3">
        Admin Dashboard
      </h1>

      <p className="text-gray-600 mb-10">
        Welcome to the PPBMS Admin Panel. Manage programmes, cohorts,
        supervisors, and student progress.
      </p>

      {/* SYSTEM TOOLS */}
      <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <h2 className="text-2xl font-semibold mb-6">System Tools</h2>

        <ul className="space-y-5 text-lg">

          {/* View all students */}
          <li className="flex items-center gap-4">
            <span className="text-purple-600 text-xl">📄</span>
            <button onClick={loadStudents} className="text-purple-700 hover:underline">
              View all students from Google Sheet
            </button>
          </li>

          {/* At-risk students */}
          <li className="flex items-center gap-4">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <button onClick={loadAtRisk} className="text-purple-700 hover:underline">
              Monitor late / at-risk students
            </button>
          </li>

          {/* Reset cache */}
          <li className="flex items-center gap-4">
            <span className="text-blue-600 text-xl">🔄</span>
            <button onClick={resetCache} className="text-purple-700 hover:underline">
              Reset Google Sheet cache
            </button>
          </li>

          {/* Roles */}
          <li className="flex items-center gap-4">
            <span className="text-gray-600 text-xl">⚙️</span>
            <span>Configure roles (coming soon)</span>
          </li>

        </ul>
      </div>

      {/* ERROR MESSAGE */}
      {error && <p className="mt-6 text-red-600 font-semibold">{error}</p>}

      {/* LOADING */}
      {loading && <p className="mt-6 text-purple-600">Loading…</p>}

      {/* ======================================================
          STUDENT TABLE
      ====================================================== */}
      {students.length > 0 && (
        <div className="mt-10 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold mb-5">All Students ({students.length})</h3>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left border">
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Programme</th>
                <th className="p-2">Supervisor</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-2">{s["Student Name"] || "-"}</td>
                  <td className="p-2">{s["Student's Email"] || "-"}</td>
                  <td className="p-2">{s["Programme"] || "-"}</td>
                  <td className="p-2">{s["Main Supervisor"] || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================
          AT-RISK STUDENTS UI
      ====================================================== */}
      {atRisk.length > 0 && (
        <div className="mt-12 bg-white p-8 rounded-2xl shadow-xl border border-red-200">
          <h3 className="text-3xl font-bold mb-8 text-red-600">
            ⚠️ At-Risk Students ({atRisk.length})
          </h3>

          <div className="space-y-8">
            {atRisk.map((student, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-red-300 bg-red-50 shadow"
              >
                {/* Student Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-700">{student.email}</p>
                    <p className="text-sm text-gray-700">
                      Supervisor: {student.supervisor}
                    </p>
                  </div>

                  <span className="px-4 py-2 bg-red-600 text-white rounded-full shadow text-sm font-semibold">
                    {student.lateActivities.length} overdue
                  </span>
                </div>

                {/* Activities Table */}
                <table className="mt-5 w-full text-sm">
                  <thead>
                    <tr className="bg-red-100 text-red-800">
                      <th className="p-2 text-left">Activity</th>
                      <th className="p-2 text-left">Expected Date</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Days Late</th>
                    </tr>
                  </thead>

                  <tbody>
                    {student.lateActivities.map((act, idx) => {
                      const daysLate = Math.ceil(
                        (new Date() - new Date(act.expected)) /
                          (1000 * 60 * 60 * 24)
                      );

                      return (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{act.activity}</td>
                          <td className="p-2">{act.expected}</td>
                          <td className="p-2 text-red-600 font-semibold">Not Completed</td>
                          <td className="p-2 font-semibold text-red-700">
                            {daysLate} days late
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
