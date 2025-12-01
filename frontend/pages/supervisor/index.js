// frontend/pages/supervisor/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import SupervisorStudentTable from "../../components/SupervisorStudentTable";
import ProgressCard from "../../components/ProgressCard";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SupervisorIndex() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchStudents() {
      const token = localStorage.getItem("ppbms_token");
      if (!token) { setLoading(false); return; }
      const supervisorEmail = localStorage.getItem("ppbms_user_email");
      if (!supervisorEmail) { setLoading(false); return; }
      try {
        const r = await fetch(`${API}/api/supervisor/students?email=${encodeURIComponent(supervisorEmail)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await r.json();
        setStudents(data.students || []);
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    }
    fetchStudents();
  }, []);

  const filtered = !search ? students : students.filter(s => (s.name || "").toLowerCase().includes(search.toLowerCase()) || (s.id || "").toLowerCase().includes(search.toLowerCase()));

  const counts = {
    ahead: students.filter(s => s.status === "Ahead" || s.progress === 100).length,
    onTrack: students.filter(s => s.status === "On Track").length,
    atRisk: students.filter(s => s.status === "At Risk").length,
    behind: students.filter(s => s.status === "Behind").length,
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white">
        <h1 className="text-2xl font-bold">Supervisor Dashboard</h1>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <ProgressCard title="Ahead/Completed" value={counts.ahead} />
        <ProgressCard title="On Track" value={counts.onTrack} />
        <ProgressCard title="At Risk" value={counts.atRisk} />
        <ProgressCard title="Behind" value={counts.behind} />
      </div>

      <div className="flex gap-4 items-center">
        <input value={search} onChange={(e)=>setSearch(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Search name or email" />
        <Link href="/supervisor/analytics"><a className="px-3 py-2 rounded bg-purple-600 text-white">Analytics</a></Link>
      </div>

      <div className="bg-white rounded p-4 shadow">
        <SupervisorStudentTable students={filtered} />
      </div>
    </div>
  );
}
