import { useEffect, useState } from "react";
import Link from "next/link";

export default function SupervisorDashboard() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/supervisor/students`);
        const data = await res.json();
        setStudents(data.students || []);
        setFiltered(data.students || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = (v) => {
    const q = v.toLowerCase();
    setFiltered(
      students.filter(
        (s) =>
          s.student_name.toLowerCase().includes(q) ||
          (s.programme || "").toLowerCase().includes(q)
      )
    );
  };

  if (loading) return <div className="p-10 text-lg">Loading…</div>;

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* HEADER */}
      <div className="p-8 rounded-xl bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <h1 className="text-4xl font-bold">Supervisor Dashboard</h1>
        <p className="text-lg mt-2 opacity-90">
          Overview of student progress and performance.
        </p>
      </div>

      {/* FILTER + SEARCH */}
      <div className="bg-white shadow p-4 rounded-xl flex items-center gap-4">
        <input
          type="text"
          placeholder="Search student..."
          onChange={(e) => handleSearch(e.target.value)}
          className="border p-2 w-full rounded-lg"
        />
      </div>

      {/* STATUS CARDS */}
      <div className="grid grid-cols-4 gap-6">
        {["Ahead", "On Track", "At Risk", "Behind"].map((label, i) => (
          <div
            key={i}
            className="p-6 bg-white rounded-xl shadow text-center border"
          >
            <div className="text-xl font-semibold">{label}</div>
            <div className="mt-2 text-4xl font-bold text-purple-700">
              {students.filter((s) => s.status === label).length}
            </div>
          </div>
        ))}
      </div>

      {/* STUDENT TABLE */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-4 text-purple-700">
          Student List
        </h2>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-purple-600 text-white text-left">
              <th className="p-3">Student</th>
              <th className="p-3">Programme</th>
              <th className="p-3">Supervisor</th>
              <th className="p-3">Progress</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="p-3">{s.student_name}</td>
                <td className="p-3">{s.programme}</td>
                <td className="p-3">{s.supervisor}</td>
                <td className="p-3">
                  <div className="font-semibold">{s.progress}%</div>
                </td>
                <td className="p-3">
                  <span className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700">
                    {s.status}
                  </span>
                </td>

                <td className="p-3 text-right">
                  <Link
                    href={`/supervisor/student/${s.student_email}`}
                    className="text-purple-600 hover:underline"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
