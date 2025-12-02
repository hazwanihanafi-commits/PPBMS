import { useEffect, useState } from "react";
import StatusBadge from "../../components/StatusBadge";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SupervisorDashboard() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");

    if (!token) {
      setError("Not logged in");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await fetch(`${API}/api/supervisor/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to load");

        setStudents(data.students);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <h1 className="text-4xl font-bold text-purple-700">
        Students Under My Supervision
      </h1>

      {students.length === 0 && (
        <div className="p-4 bg-yellow-100 border-l-4 border-yellow-600 text-gray-700">
          No students assigned to your email.
        </div>
      )}

      {/* Student Cards */}
      <div className="space-y-5">
        {students.map((s) => (
          <div
            key={s.email}
            className="bg-white rounded-xl p-6 shadow border border-gray-100"
          >
            <div className="flex justify-between items-start">

              {/* LEFT PROFILE INFO */}
              <div>
                <h2 className="text-xl font-bold">{s.student_name}</h2>
                <p className="text-gray-600 text-sm">{s.programme}</p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Email:</strong> {s.email}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Field:</strong> {s.field || "-"}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Start Date:</strong> {s.start_date || "-"}
                </p>
              </div>

              {/* RIGHT SIDE: STATUS + PERCENTAGE */}
              <div className="text-right">
                <StatusBadge status={s.overall_status} />

                <div className="text-4xl font-bold mt-2">
                  {s.progress_percent}%
                </div>

                <div className="text-sm text-gray-600">
                  {s.completed} / {s.total} completed
                </div>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="mt-4 bg-gray-200 h-3 w-full rounded">
              <div
                className={`h-3 rounded ${
                  s.overall_status === "Late"
                    ? "bg-red-500"
                    : s.overall_status === "Completed"
                    ? "bg-green-600"
                    : "bg-purple-600"
                }`}
                style={{ width: `${s.progress_percent}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
