import { useState } from "react";
import { API_BASE } from "../../utils/api";

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadStudents() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/admin/all-students`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("ppbms_token")}` },
      });

      const json = await res.json();
      if (res.ok) setStudents(json.students || []);
      else setMessage(json.error || "Failed to fetch students");
    } catch {
      setMessage("Unable to load students");
    }
    setLoading(false);
  }

  async function resetCache() {
    try {
      const res = await fetch(`${API_BASE}/admin/reset-cache`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("ppbms_token")}` },
      });

      const json = await res.json();
      setMessage(json.message || "Cache cleared");
    } catch {
      setMessage("Failed to reset cache");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-10">

      {/* TOP HEADER */}
      <header className="mb-12">
        <h1 className="text-5xl font-extrabold text-purple-800 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-3 text-lg max-w-4xl">
          Welcome to the PPBMS Admin Panel. Manage programmes, cohorts, supervisors,
          Google Sheet integration, and student progress information.
        </p>
      </header>

      {/* GRID: SYSTEM CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

        {/* Total Students */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-gray-100">
          <p className="text-gray-500">Total Students</p>
          <h2 className="text-3xl font-bold text-purple-700 mt-1">
            {students.length > 0 ? students.length : "--"}
          </h2>
        </div>

        {/* Cache Status */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-gray-100">
          <p className="text-gray-500">Cache Status</p>
          <h2 className="text-xl font-semibold text-orange-500 mt-1">
            {message.includes("cache") ? message : "Active"}
          </h2>
        </div>

        {/* Tools Count */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-gray-100">
          <p className="text-gray-500">Available Tools</p>
          <h2 className="text-3xl font-bold text-purple-700 mt-1">4</h2>
        </div>

      </div>

      {/* SYSTEM TOOLS PANEL */}
      <div className="bg-white p-8 rounded-2xl shadow-card border border-gray-100 max-w-4xl">

        <h2 className="text-2xl font-bold text-gray-900 mb-5">System Tools</h2>

        <div className="space-y-4 text-lg">

          {/* View All Students */}
          <button
            onClick={loadStudents}
            className="flex items-center gap-3 text-purple-700 font-medium hover:underline"
          >
            <span className="text-2xl">📄</span>
            View all students from Google Sheet
          </button>

          {/* Monitor At Risk */}
          <div className="flex items-center gap-3 text-gray-700">
            <span className="text-2xl">⚠️</span>
            Monitor late / at-risk students (coming soon)
          </div>

          {/* Reset Cache */}
          <button
            onClick={resetCache}
            className="flex items-center gap-3 text-orange-600 font-medium hover:underline"
          >
            <span className="text-2xl">🔄</span>
            Reset Google Sheet Cache
          </button>

          {/* Configure Roles */}
          <div className="flex items-center gap-3 text-gray-500">
            <span className="text-2xl">⚙️</span>
            Configure roles (coming soon)
          </div>

        </div>
      </div>

      {/* STUDENT PREVIEW TABLE */}
      {students.length > 0 && (
        <div className="mt-12 bg-white shadow-card rounded-2xl p-8 border border-gray-100 overflow-x-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Student List</h2>

          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Programme</th>
                <th className="p-3 font-medium">Supervisor</th>
              </tr>
            </thead>
            <tbody>
              {students.slice(0, 20).map((s, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3">{s["Student Name"]}</td>
                  <td className="p-3">{s["Student's Email"]}</td>
                  <td className="p-3">{s["Programme"]}</td>
                  <td className="p-3">{s["Main Supervisor"]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-gray-500 text-sm mt-4">
            Showing first 20 students…
          </p>
        </div>
      )}

      {/* FEEDBACK MESSAGE */}
      {message && (
        <div className="mt-6 text-purple-700 font-semibold">{message}</div>
      )}
    </div>
  );
}
