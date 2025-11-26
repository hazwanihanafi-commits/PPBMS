import { useEffect, useState } from "react";
import ProfileCard from "../../components/ProfileCard";
import StatCard from "../../components/StatCard";
import CircularMilestoneChart from "../../components/CircularMilestoneChart";
import GanttTimeline from "../../components/GanttTimeline";
import { FiMail, FiCheckCircle, FiClock, FiAlertTriangle } from "react-icons/fi";

const API = process.env.NEXT_PUBLIC_API_BASE;

const DUE = {
  "P1 Submitted": "2024-08-31",
  "P3 Submitted": "2025-01-31",
  "P4 Submitted": "2025-02-15",
  "P5 Submitted": "2025-10-01",
};

export default function StudentDashboard() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load token
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) return (window.location.href = "/login");
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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-10 text-center text-lg">Loading…</div>;
  if (error)
    return (
      <div className="p-10 text-center text-red-600 text-lg">
        Failed to load student data:<br /> {error}
      </div>
    );
  if (!row) return null;

  // Progress calculation
  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(Boolean).length;

  const percent = Math.round((completed / 4) * 100);

  // Determine status badge
  let statusText = "On Track";
  let statusColor = "bg-green-500";

  if (percent < 40) {
    statusText = "Behind";
    statusColor = "bg-red-500";
  } else if (percent < 70) {
    statusText = "At Risk";
    statusColor = "bg-yellow-500";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      
      {/* HEADER */}
      <header className="bg-gradient-to-r from-purple-700 to-indigo-600 text-white py-8 shadow-md">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-3xl font-extrabold">Student Dashboard</h1>
          <p className="text-purple-200 mt-1">{row.student_name}</p>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20">

        {/* LEFT COLUMN — profile */}
        <div className="lg:col-span-1">
          <ProfileCard
            name={row.student_name}
            programme={row.programme}
            supervisor={row.main_supervisor}
            email={row.student_email}
          />

          {/* Status badge */}
          <div className={`mt-4 px-4 py-3 text-white rounded-lg shadow ${statusColor}`}>
            <div className="flex items-center gap-2 font-semibold">
              {statusText === "Behind" && <FiAlertTriangle />}
              {statusText === "At Risk" && <FiClock />}
              {statusText === "On Track" && <FiCheckCircle />}
              {statusText}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — widgets */}
        <div className="lg:col-span-3 space-y-8">

          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Milestones Completed" value={`${completed} / 4`} color="green" />
            <StatCard title="Last Submission" value={
              row.raw["P5 Submitted"] ||
              row.raw["P4 Submitted"] ||
              row.raw["P3 Submitted"] ||
              row.raw["P1 Submitted"] ||
              "—"
            } color="purple" />
            <StatCard title="Overall Status" value={row.raw["Status P"] || "—"} color="blue" />
          </div>

          {/* Circular progress */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Milestone Progress</h2>
            <CircularMilestoneChart percentage={percent} />
          </div>

          {/* Gantt timeline */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Gantt Timeline</h2>
            <GanttTimeline raw={row.raw} due={DUE} />
          </div>

          {/* Contact supervisor */}
          <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-700">Need help?</p>
              <p className="text-gray-500 text-sm">Contact your supervisor directly.</p>
            </div>
            <a
              href={`mailto:${row.main_supervisor}`}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
            >
              <FiMail /> Email Supervisor
            </a>
          </div>

        </div>
      </main>
    </div>
  );
}
