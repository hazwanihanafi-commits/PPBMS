// frontend/pages/student/me.js
import { useEffect, useState } from "react";
import ProfileCard from "../../components/ProfileCard";
import StatCard from "../../components/StatCard";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function StudentDashboard() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) window.location.href = "/login";
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const r = await fetch(`${API}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error(await r.text());
        const data = await r.json();
        setRow(data.row);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!row) return null;

  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="max-w-6xl mx-auto mb-6">
        <h1 className="text-3xl font-extrabold text-purple-700">Student Dashboard</h1>
        <p className="text-gray-600">{row.student_name} — {row.programme}</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* LEFT: PROFILE */}
        <div className="lg:col-span-1">
          <ProfileCard
            name={row.student_name}
            programme={row.programme}
            supervisor={row.main_supervisor}
            email={row.student_email}
          />
        </div>

        {/* RIGHT: STATS */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Milestones Completed" value={`${completed} / 4`} icon="success" />
          <StatCard
            title="Last Submission"
            value={
              row.raw["P5 Submitted"] ||
              row.raw["P4 Submitted"] ||
              row.raw["P3 Submitted"] ||
              row.raw["P1 Submitted"] ||
              "—"
            }
            icon="progress"
          />
          <StatCard title="Overall Status" value={row.raw["Status P"] || "—"} icon="stats" />
        </div>
      </main>
    </div>
  );
}
