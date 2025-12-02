// pages/supervisor/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE;

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

    async function load() {
      try {
        const res = await fetch(`${API}/api/supervisor/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const txt = await res.text();
        if (!res.ok) throw new Error(txt);

        const data = JSON.parse(txt);
        setStudents(data.students || []);
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
    <div className="max-w-7xl mx-auto p-6 space-y-8">

      <h1 className="text-3xl font-bold text-purple-700">
        Supervisor Dashboard
      </h1>
      <p className="text-gray-600">
        {students.length} student(s) under your supervision
      </p>

      {/* Students List */}
      {students.map((stu, idx) => (
        <div
          key={idx}
          className="bg-white shadow rounded-xl p-6 space-y-5 border-l-4 border-purple-500"
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-xl">{stu.student_name}</div>
              <div className="text-sm text-gray-600">{stu.email}</div>
              <div className="text-sm text-gray-600">
                {stu.programme} • Field: {stu.field}
              </div>
              <div className="text-sm text-gray-600">
                Start Date: {stu.start_date}
              </div>
            </div>

            {/* Progress Circle */}
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-purple-600">
                {stu.progress_percent}%
              </div>
              <div className="text-gray-500 text-sm">
                {stu.completed}/{stu.total} completed
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {stu.progress_percent === 100 && (
              <span className="px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                🎉 Completed
              </span>
            )}

            {stu.progress_percent < 100 && stu.timeline.some(t => t.status === "Late") && (
              <span className="px-4 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                ⚠️ At Risk (Late milestones)
              </span>
            )}

            {stu.progress_percent < 100 &&
              !stu.timeline.some(t => t.status === "Late") && (
                <span className="px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  ⏳ On Track
                </span>
              )}
          </div>

          {/* Timeline Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2 border">Activity</th>
                  <th className="p-2 border">Expected</th>
                  <th className="p-2 border">Actual</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {stu.timeline.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-2 border">{t.activity}</td>
                    <td className="p-2 border">{t.expected}</td>
                    <td className="p-2 border">
                      {t.actual || <span className="text-gray-400">—</span>}
                    </td>
                    <td
                      className={`p-2 border font-semibold ${
                        t.status === "Late"
                          ? "text-red-600"
                          : t.status === "Completed"
                          ? "text-green-600"
                          : "text-blue-600"
                      }`}
                    >
                      {t.status}
                    </td>
                    <td className="p-2 border">{t.remaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      ))}
    </div>
  );
}
