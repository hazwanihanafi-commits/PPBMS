// pages/supervisor/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SupervisorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");
    if (!token) {
      setError("Not logged in");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API}/api/supervisor/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const txt = await res.text();
        if (!res.ok) throw new Error(txt);
        const data = JSON.parse(txt);

        setStudents(data.students || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function getStatusColor(status) {
    if (status === "On Track") return "text-green-600";
    if (status === "Late") return "text-red-600";
    if (status === "At Risk") return "text-orange-600";
    return "text-gray-600";
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold text-purple-700">My Supervised Students</h1>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && students.length === 0 && (
        <div className="text-gray-600">No students found.</div>
      )}

      {/* TABLE */}
      {students.length > 0 && (
        <div className="overflow-x-auto rounded-xl shadow bg-white p-4">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Student</th>
                <th className="p-3">Programme</th>
                <th className="p-3">Field</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const pct = s.progress_percent;
                const status =
                  pct >= 70
                    ? "On Track"
                    : pct >= 40
                    ? "Late"
                    : "At Risk";

                return (
                  <tr key={s.email} className="border-b">
                    <td className="p-3">
                      <div className="font-semibold">{s.student_name}</div>
                      <div className="text-gray-500 text-xs">{s.email}</div>
                    </td>

                    <td className="p-3 text-center">{s.programme}</td>
                    <td className="p-3 text-center">{s.field || "-"}</td>

                    {/* Progress Bar */}
                    <td className="p-3 w-40">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            pct >= 70
                              ? "bg-green-500"
                              : pct >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <div className="text-xs mt-1">{pct}%</div>
                    </td>

                    {/* Status */}
                    <td className={`p-3 font-semibold ${getStatusColor(status)}`}>
                      {status}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() =>
                          router.push(`/supervisor/student?email=${s.email}`)
                        }
                        className="px-3 py-1 bg-purple-600 text-white rounded-xl text-xs hover:bg-purple-700"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
