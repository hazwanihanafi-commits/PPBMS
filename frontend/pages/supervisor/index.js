// pages/supervisor/index.js
import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function SupervisorDashboard() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");
    if (!token) return;

    fetch(`${API}/api/supervisor/list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const list = data.students || [];
        list.forEach((s) => {
          // Compute progress: count submitted P1, P3, P4, P5
          const completed = [
            s.raw["P1 Submitted"],
            s.raw["P3 Submitted"],
            s.raw["P4 Submitted"],
            s.raw["P5 Submitted"],
          ].filter(Boolean).length;

          s.progress = Math.round((completed / 4) * 100);

          // Compute status
          if (s.progress === 100) s.status = "Ahead";
          else if (s.progress >= 75) s.status = "On Track";
          else if (s.progress >= 50) s.status = "At Risk";
          else s.status = "Behind";
        });

        setStudents(list);
        setFiltered(list);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(students);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      students.filter((s) =>
        s.student_name.toLowerCase().includes(q)
      )
    );
  }, [search, students]);

  if (loading) {
    return <div className="p-6">Loading supervisor dashboard…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
        <p className="mt-1 text-lg opacity-90">
          Overview of student progress and performance.
        </p>
      </div>

      {/* SEARCH */}
      <input
        className="w-full p-3 rounded-lg border shadow-sm"
        placeholder="Search student…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* METRICS */}
      <div className="grid grid-cols-4 gap-4">
        {["Ahead", "On Track", "At Risk", "Behind"].map((cat) => {
          const count = students.filter((s) => s.status === cat).length;
          return (
            <div
              key={cat}
              className="rounded-xl bg-white p-4 shadow text-center"
            >
              <div className="text-lg font-semibold">{cat}</div>
              <div className="text-3xl font-bold">{count}</div>
              <div className="text-sm text-gray-500">
                {students.length
                  ? Math.round((count / students.length) * 100)
                  : 0}
                %
              </div>
            </div>
          );
        })}
      </div>

      {/* STUDENT LIST */}
      <div className="rounded-xl bg-white p-4 shadow">
        <h2 className="text-xl font-bold mb-4">Student List</h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-600 text-white">
              <th className="p-3 text-left">Student</th>
              <th className="p-3 text-left">Programme</th>
              <th className="p-3 text-left">Progress</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((s, idx) => (
              <tr
                key={idx}
                className="border-b hover:bg-purple-50 cursor-pointer"
              >
                <td className="p-3">
                  <Link href={`/supervisor/${s.email}`}>
                    <span className="text-purple-700 underline">
                      {s.student_name}
                    </span>
                  </Link>
                </td>

                <td className="p-3">{s.programme}</td>
                <td className="p-3">{s.progress}%</td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-white
                      ${s.status === "Ahead" ? "bg-green-600" : ""}
                      ${s.status === "On Track" ? "bg-blue-600" : ""}
                      ${s.status === "At Risk" ? "bg-yellow-500" : ""}
                      ${s.status === "Behind" ? "bg-red-600" : ""}
                    `}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={4}>
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
