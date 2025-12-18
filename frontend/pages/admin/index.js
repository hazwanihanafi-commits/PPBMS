import { useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

export default function AdminDashboard() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= LOAD ALL STUDENTS ================= */
  async function loadStudents() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/all-students`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to load students");
      else setStudents(data.students || []);
    } catch {
      setError("Unable to load students");
    }

    setLoading(false);
  }

  /* ================= LOAD AT-RISK ================= */
  async function loadAtRisk() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/at-risk`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to load at-risk students");
      else setAtRisk(data.atRisk || []);
    } catch {
      setError("Unable to load at-risk students");
    }

    setLoading(false);
  }

  /* ================= RESET CACHE ================= */
  async function resetCache() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/reset-cache`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to reset cache");
      else alert("Google Sheet cache cleared");
    } catch {
      setError("Unable to reset cache");
    }

    setLoading(false);
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-purple-700 mb-3">
        Admin Dashboard
      </h1>

      <p className="text-gray-600 mb-10">
        Manage student progress, documents, and monitoring.
      </p>

      {/* ================= SYSTEM TOOLS ================= */}
      <div className="bg-white shadow-xl rounded-2xl p-8 border mb-10">
        <h2 className="text-2xl font-semibold mb-6">System Tools</h2>

        <ul className="space-y-4">
          <li>
            <button
              onClick={loadStudents}
              className="text-purple-700 hover:underline"
            >
              📄 View all students from Google Sheet
            </button>
          </li>

          <li>
            <button
              onClick={loadAtRisk}
              className="text-purple-700 hover:underline"
            >
              ⚠️ Monitor late / at-risk students
            </button>
          </li>

          <li>
            <button
              onClick={resetCache}
              className="text-purple-700 hover:underline"
            >
              🔄 Reset Google Sheet cache
            </button>
          </li>
        </ul>
      </div>

      {error && <p className="text-red-600 mb-6">{error}</p>}
      {loading && <p className="text-purple-600 mb-6">Loading…</p>}

      {/* ================= ALL STUDENTS TABLE ================= */}
      {students.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h3 className="text-2xl font-bold mb-4">
            All Students ({students.length})
          </h3>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Programme</th>
                <th className="p-3 text-left">Supervisor</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s, i) => {
                const email = encodeURIComponent(
                  s["Student's Email"] || ""
                );

                return (
                  <tr
                    key={i}
                    onClick={() =>
                      router.push(`/admin/student/${email}`)
                    }
                    className="border-b hover:bg-purple-50 cursor-pointer"
                  >
                    <td className="p-3 font-semibold text-purple-700 underline">
                      {s["Student Name"] || "-"}
                    </td>

                    <td className="p-3 text-purple-600">
                      {s["Student's Email"] || "-"}
                    </td>

                    <td className="p-3">
                      {s["Programme"] || "-"}
                    </td>

                    <td className="p-3">
                      {s["Main Supervisor"] || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= AT-RISK STUDENTS ================= */}
      {atRisk.length > 0 && (
        <div className="bg-white border border-red-200 rounded-2xl p-8">
          <h3 className="text-3xl font-bold text-red-600 mb-6">
            ⚠️ At-Risk Students ({atRisk.length})
          </h3>

          {atRisk.map((s, i) => (
            <div
              key={i}
              className="mb-6 p-5 rounded-xl border border-red-300 bg-red-50"
            >
              <p className="font-bold">{s.name}</p>
              <p className="text-sm">{s.email}</p>
              <p className="text-sm mb-3">
                Supervisor: {s.supervisor}
              </p>

              <ul className="list-disc pl-6 text-sm">
                {s.lateActivities.map((a, idx) => (
                  <li key={idx}>
                    {a.activity} (Expected: {a.expected})
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
