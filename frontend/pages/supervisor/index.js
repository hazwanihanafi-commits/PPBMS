import { useEffect, useState } from "react";

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

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-purple-700">
        Students Under My Supervision
      </h1>

      {students.length === 0 && (
        <div className="text-gray-600 p-4 bg-yellow-100 border-l-4 border-yellow-600">
          No students assigned to your email.
        </div>
      )}

      <div className="space-y-4">
        {students.map((s) => (
          <div key={s.email} className="bg-white shadow p-5 rounded-xl">
            <div className="flex justify-between">
              <div>
                <p className="font-bold text-xl">{s.student_name}</p>
                <p className="text-gray-600">{s.email}</p>
                <p className="text-sm text-gray-700">{s.programme}</p>
                <p className="text-sm">{s.field}</p>
              </div>

              <div className="flex flex-col justify-center items-end">
                <div className="text-3xl font-bold">{s.progress_percent}%</div>
                <div className="text-sm text-gray-600">
                  {s.completed} / {s.total} completed
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="mt-4 bg-gray-200 h-3 w-full rounded">
              <div
                className="h-3 bg-purple-600 rounded"
                style={{ width: `${s.progress_percent}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
