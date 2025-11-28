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
    const supervisorEmail = localStorage.getItem("ppbms_user_email");

    if (!token || !supervisorEmail) {
      setLoading(false);
      return;
    }

    fetch(
      `${API}/api/supervisor/students?email=${encodeURIComponent(supervisorEmail)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(async (res) => {
        const txt = await res.text();
        if (!res.ok) throw new Error(txt);
        return JSON.parse(txt);
      })
      .then((data) => {
        const list = data.students || [];
        setStudents(list);
        setFiltered(list);
      })
      .catch((e) => console.error("Supervisee fetch error:", e))
      .finally(() => setLoading(false));
  }, []);

  // SEARCH
  useEffect(() => {
    if (!search.trim()) return setFiltered(students);
    const q = search.toLowerCase();
    setFiltered(
      students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      )
    );
  }, [search, students]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow">
        <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
        <p className="opacity-90 text-sm">Overview of your supervisees</p>
      </header>

      {/* SEARCH BAR */}
      <input
        className="w-full p-3 border rounded"
        placeholder="Search student..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* STUDENT TABLE */}
      <div className="bg-white p-4 rounded-xl shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-600 text-white">
              <th className="p-2">Student</th>
              <th className="p-2">Programme</th>
              <th className="p-2">Progress</th>
              <th className="p-2">Status</th>
              <th className="p-2">View</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="p-3 text-center" colSpan="5">
                  Loading…
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td className="p-3 text-center" colSpan="5">
                  No students found.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((s, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.programme}</td>
                  <td className="p-2">{s.progress}%</td>
                  <td className="p-2">{s.status}</td>
                  <td className="p-2">
                    <Link href={`/supervisor/${s.id}`}>
                      <span className="text-purple-600 underline cursor-pointer">
                        View
                      </span>
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
