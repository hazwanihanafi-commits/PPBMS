// frontend/pages/supervisor/index.js
import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SupervisorIndex() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");
    if (!token) { setLoading(false); return; }

    const supervisorEmail = localStorage.getItem("ppbms_user_email");
    if (!supervisorEmail) { setLoading(false); return; }

    (async () => {
      try {
        const r = await fetch(`${API}/api/supervisor/students?email=${encodeURIComponent(supervisorEmail)}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await r.json();
        setStudents(data.students || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = !search ? students : students.filter(s => (s.name || "").toLowerCase().includes(search.toLowerCase()) || (s.id || "").toLowerCase().includes(search.toLowerCase()));

  const counts = {
    ahead: students.filter(s => s.status === "Ahead" || s.progress === 100).length,
    onTrack: students.filter(s => s.status === "On Track").length,
    atRisk: students.filter(s => s.status === "At Risk").length,
    behind: students.filter(s => s.status === "Behind").length,
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow">
        <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded shadow"><div className="text-sm">Ahead / Completed</div><div className="text-2xl font-bold">{counts.ahead}</div></div>
        <div className="p-4 bg-white rounded shadow"><div className="text-sm">On Track</div><div className="text-2xl font-bold">{counts.onTrack}</div></div>
        <div className="p-4 bg-white rounded shadow"><div className="text-sm">At Risk</div><div className="text-2xl font-bold">{counts.atRisk}</div></div>
        <div className="p-4 bg-white rounded shadow"><div className="text-sm">Behind</div><div className="text-2xl font-bold">{counts.behind}</div></div>
      </div>

      <div className="flex gap-4 items-center">
        <input className="flex-1 p-3 rounded border" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        {loading ? <div className="p-6">Loading…</div> : (
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Programme</th>
                <th className="p-2">Progress</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-t">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.id}</td>
                  <td className="p-2">{s.programme}</td>
                  <td className="p-2">{s.progress}%</td>
                  <td className="p-2">{s.status}</td>
                  <td className="p-2">
                    <Link href={`/supervisor/${encodeURIComponent(s.id)}`}><a className="text-purple-600">Open</a></Link>
                    {" • "}
                    <Link href={`/student/me`}><a className="text-gray-600">View (as student)</a></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
