// frontend/pages/student/me.js
import { useEffect, useState } from "react";

// Components
import ProfileCard from "../../components/ProfileCard";
import StatCard from "../../components/StatCard";

// Milestone due dates
const DUE_MAP = {
  "P1 Submitted": "2024-08-31",
  "P3 Submitted": "2025-01-31",
  "P4 Submitted": "2025-02-15",
  "P5 Submitted": "2025-10-01",
};

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function StudentDashboard() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load token
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      window.location.href = "/login";
      return;
    }
    setToken(t);
  }, []);

  // Load student data
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
        console.error("Failed to load student:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading)
    return <div className="p-10 text-center text-lg">Loading dashboard…</div>;

  if (error)
    return (
      <div className="p-10 text-center text-red-600 text-lg">
        Failed to load student data:<br /> {error}
      </div>
    );

  if (!row) return null;

  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-purple-700">
            Student Dashboard
          </h1>
          <div className="text-sm text-gray-600 font-medium">
            {row.student_name} — {row.programme}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile */}
        <div className="lg:col-span-1">
          <ProfileCard
            name={row.student_name}
            programme={row.programme}
            supervisor={row.main_supervisor}
            email={row.student_email}
          />
        </div>

        {/* Stats */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">

          <StatCard
            title="Milestones Completed"
            value={`${completed} / 4`}
            icon="success"
            color="green"
          />

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
            color="purple"
          />

          <StatCard
            title="Overall Status"
            value={row.raw["Status P"] || "—"}
            icon="stats"
            color="blue"
          />

        </div>
      </main>
    </div>
  );
}
