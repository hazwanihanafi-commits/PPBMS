// pages/supervisor/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import SupervisorStudentTable from "../../components/SupervisorStudentTable";
import ProgressCard from "../../components/ProgressCard";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function SupervisorIndex() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");
    if (!token) { setLoading(false); return; }

    const supEmail = localStorage.getItem("ppbms_user_email");
    if (!supEmail) { setLoading(false); return; }

    fetch(`${API}/api/supervisor/students?email=${encodeURIComponent(supEmail)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        // data.students expected to contain fields id, name, programme, progress, status, supervisor_name
        const list = (data.students || []).map(s => ({
          ...s,
          supervisor_name: s.supervisor_name || s.supervisor || s["Main Supervisor"] || s["Main Supervisor's Name"] || s["Main Supervisor's Email"] || ""
        }));
        setStudents(list);
        setFiltered(list);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search) return setFiltered(students);
    const q = search.toLowerCase();
    setFiltered(students.filter(s => (s.name || "").toLowerCase().includes(q) || (s.id || "").toLowerCase().includes(q)));
  }, [search, students]);

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
        {loading ? <div className="p-6">Loading…</div> : <SupervisorStudentTable students={filtered} />}
      </div>
    </div>
  );
}
