// frontend/pages/supervisor/dashboard.js
import { useEffect, useState } from "react";
import StatCard from "../../components/StatCard";
import ProfileCard from "../../components/ProfileCard";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function SupervisorDashboard() {
  const [token, setToken] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => setToken(localStorage.getItem("ppbms_token")), []);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/admin/students`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then(d => setRows(d.rows || []))
      .catch(err => { console.error(err); alert("Failed to load students"); })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="p-8">Loading…</div>;

  const filtered = rows.filter(r => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (r.student_name||"").toLowerCase().includes(s) || (r.main_supervisor||"").toLowerCase().includes(s) || (r.programme||"").toLowerCase().includes(s);
  });

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Supervisor Dashboard</h1>

        <div className="mb-4 flex items-center space-x-3">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search student / supervisor / programme" className="flex-1 p-2 border rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total students" value={`${rows.length}`} icon="stats" color="teal" />
          <StatCard title="Showing" value={`${filtered.length}`} icon="progress" color="purple" />
          <StatCard title="Late alerts" value={`${rows.filter(r=> {
            const due = r["P1 Submitted"] && r["P1 Submitted"]; // simplistic check; customize
            return false;
          }).length}`} icon="success" color="orange" />
        </div>

        <div className="mt-6 space-y-3">
          {filtered.map(r => (
            <div key={r.matric || r.student_name} className="bg-white border rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{r.student_name}</div>
                <div className="text-sm text-gray-500">{r.programme} — {r.student_email}</div>
              </div>
              <div className="flex items-center space-x-2">
                <a href={`/student/me?email=${encodeURIComponent(r["Student's Email"] || r.student_email || "")}`} className="text-indigo-600 hover:underline">Open</a>
                <a href={`mailto:${r["Main Supervisor's Email"] || r.main_supervisor || ""}`} className="px-3 py-1 bg-gray-100 rounded-md text-sm">Email</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
