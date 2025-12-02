// frontend/pages/supervisor/index.js
import { useEffect, useState } from "react";
import StatusBadge from "../../components/StatusBadge";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

function getOverallStatus(student) {
  const { completed, total, timeline } = student;

  if (total > 0 && completed === total) return "Completed";
  if (timeline && timeline.some((t) => t.status === "Late")) return "Late";
  return "On Track";
}

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
        if (!res.ok) throw new Error(data.error || "Failed to load students");

        setStudents(data.students || []);
      } catch (e) {
        setError(e.message || "Error loading students");
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
        <div className="p-4 bg-yellow-100 border-l-4 border-yellow-600 text-gray-700 rounded">
          No students assigned to your email.
        </div>
      )}

      {/* Student Cards */}
      <div className="space-y-5">
        {students.map((s) => {
          const status = getOverallStatus(s);

          return (
            <div
              key={s.email}
              className="bg-white rounded-xl p-6 shadow border border-gray-100"
            >
              <div className="flex justify-between items-start gap-4">
                {/* LEFT: Info */}
                <div>
                  <h2 className="text-xl font-bold">{s.student_name}</h2>
                  <p className="text-gray-600 text-sm">{s.programme}</p>

                  <div className="mt-2 text-sm text-gray-700 space-y-1">
                    <p>
                      <strong>Email:</strong> {s.email || "-"}
                    </p>
                    <p>
                      <strong>Field:</strong> {s.field || "-"}
                    </p>
                    <p>
                      <strong>Department:</strong> {s.department || "-"}
                    </p>
                    <p>
                      <strong>Start Date:</strong> {s.start_date || "-"}
                    </p>
                  </div>
                </div>

                {/* RIGHT: Status + % */}
                <div className="text-right">
                  <StatusBadge status={status} />
                  <div className="text-4xl font-bold mt-2">
                    {s.progress_percent || 0}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {s.completed} / {s.total} completed
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 bg-gray-200 h-3 w-full rounded">
                <div
                  className={
                    "h-3 rounded " +
                    (status === "Late"
                      ? "bg-red-500"
                      : status === "Completed"
                      ? "bg-green-600"
                      : "bg-purple-600")
                  }
                  style={{ width: `${s.progress_percent || 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
