import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadStudents() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/admin/all-students`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load students");
      } else {
        setStudents(data.students);
      }
    } catch (e) {
      setError("Unable to fetch data");
    }

    setLoading(false);
  }

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold text-purple-700 mb-4">
        Admin Dashboard
      </h1>

      <p className="text-gray-600 mb-8">
        Welcome to the PPBMS Admin Panel. Manage programmes, cohorts, supervisors,
        and student progress.
      </p>

      {/* SYSTEM TOOLS */}
      <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
        <h2 className="text-2xl font-semibold mb-4">System Tools</h2>

        <ul className="space-y-4 text-lg">
          <li className="flex items-center gap-3">
            <span className="text-purple-600 text-xl">📄</span>
            <button
              className="text-purple-700 hover:underline"
              onClick={loadStudents}
            >
              View all students from Google Sheet
            </button>
          </li>

          <li className="flex items-center gap-3">
            <span className="text-purple-600 text-xl">⚠️</span>
            <span>Monitor late / at-risk students</span>
          </li>

          <li className="flex items-center gap-3">
            <span className="text-purple-600 text-xl">🔄</span>
            <button className="text-purple-700 hover:underline">
              Reset Google Sheet cache
            </button>
          </li>

          <li className="flex items-center gap-3">
            <span className="text-purple-600 text-xl">⚙️</span>
            <span>Configure roles (coming soon)</span>
          </li>
        </ul>
      </div>

      {/* SHOW STUDENT TABLE BELOW */}
      {loading && <p className="mt-6 text-purple-600">Loading students…</p>}
      {error && <p className="mt-6 text-red-600">{error}</p>}

      {students.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-2xl shadow border border-gray-100">
          <h3 className="text-xl font-bold mb-4">Student List</h3>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b">
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
    </div>
  );
}
