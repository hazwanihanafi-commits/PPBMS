// pages/supervisor/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

function ProgressCard({ title, value }) {
  return (
    <div className="rounded-xl bg-white shadow p-6">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-bold mt-2">{value}</div>
    </div>
  );
}

export default function SupervisorIndex() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");
    if (!token) { setLoading(false); return; }
    const email = localStorage.getItem("ppbms_user_email") || router.query.email;
    if (!email) { setLoading(false); return; }

    fetch(`${API}/api/supervisor/students?email=${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setStudents(data.students || []);
        setFiltered(data.students || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [router.query.email]);

  useEffect(() => {
    if (!search) { setFiltered(students); return; }
    const q = search.toLowerCase();
    setFiltered(students.filter(s => (s.name||"").toLowerCase().includes(q) || (s.id||"").toLowerCase().includes(q)));
  }, [search, students]);

  const counts = {
    ahead: students.filter(s => s.status === "Ahead" || s.progress === 100).length,
    onTrack: students.filter(s => s.status === "On Track").length,
    atRisk: students.filter(s => s.status === "At Risk").length,
    behind: students.filter(s => s.status === "Behind").length,
  };

  async function approve(studentEmail, itemKey) {
    const token = localStorage.getItem("ppbms_token");
    if (!token) return alert("Not logged in");
    try {
      const res = await fetch(`${API}/api/tasks/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentEmail, key: itemKey, actor: "supervisor" })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "approve failed");
      // reload list
      const email = localStorage.getItem("ppbms_user_email");
      const r2 = await fetch(`${API}/api/supervisor/students?email=${encodeURIComponent(email)}`, { headers: { Authorization: `Bearer ${token}` }});
      const d2 = await r2.json();
      setStudents(d2.students || []);
      setFiltered(d2.students || []);
    } catch (e) {
      console.error(e); alert(e.message || "Approve failed");
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow">
        <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
        <p className="mt-1 text-sm">Overview of your supervisees</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ProgressCard title="Ahead / Completed" value={counts.ahead} />
        <ProgressCard title="On Track" value={counts.onTrack} />
        <ProgressCard title="At Risk" value={counts.atRisk} />
        <ProgressCard title="Behind" value={counts.behind} />
      </div>

      <div className="flex gap-4 items-center">
        <input className="flex-1 p-3 rounded border" placeholder="Search by name or email..." value={search} onChange={(e)=>setSearch(e.target.value)} />
        <Link href="/supervisor/analytics"><a className="px-4 py-2 rounded bg-purple-600 text-white">Analytics</a></Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        {loading ? <div className="p-6">Loading…</div> : (
          <>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left">Student</th>
                  <th className="text-left">Programme</th>
                  <th className="text-left">Progress</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-500">No students found.</td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3">{s.name}<div className="text-xs text-gray-500">{s.supervisor}</div></td>
                    <td className="p-3">{s.programme}</td>
                    <td className="p-3">{s.progress}%</td>
                    <td className="p-3">{s.status}</td>
                    <td className="p-3">
                      <a href={`/student/me?email=${encodeURIComponent(s.id)}`} className="text-purple-600 mr-3">View</a>
                      {/* quick approve button (supervisor must pick which item — you likely implement inside student detail view).
                          We'll give a quick example: open student detail and supervisor can approve inside. */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
