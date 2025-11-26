// frontend/pages/student/dashboard.js
import { useEffect, useState } from "react";
import ProfileCard from "../../components/ProfileCard";
import StatCard from "../../components/StatCard";
import AnimatedVerticalTimeline from "../../components/AnimatedTimeline";
import GanttTimeline from "../../components/GanttTimeline";
import ProgressTable from "../../components/ProgressTable";
import CircularMilestoneChart from "../../components/CircularMilestoneChart";

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

  // Load token from localStorage
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      window.location.href = "/login";
      return;
    }
    setToken(t);
  }, []);

  // Load student info
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
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading)
    return <div className="p-8 text-center">Loading dashboard…</div>;

  if (error)
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load: {error}
      </div>
    );

  if (!row) return null;

  // Count milestones completed
  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(Boolean).length;

  // Progress overview dummy data (can replace with backend later)
  const sampleStudents = [
    { name: "Student A", completed: 4, status: "Ahead" },
    { name: "Student B", completed: 3, status: "On Track" },
    { name: "Student C", completed: 2, status: "At Risk" },
    { name: "Student D", completed: 1, status: "Behind" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* PAGE HEADER */}
      <header className="mb-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-purple-700">
            Student Dashboard
          </h1>
          <div className="text-sm text-gray-600">
            {row.student_name} — {row.programme}
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* LEFT COLUMN – Profile */}
        <div className="lg:col-span-1">
          <ProfileCard
            name={row.student_name}
            programme={row.programme}
            supervisor={row.main_supervisor}
            email={row.student_email}
          />
        </div>

        {/* RIGHT SECTION */}
        <div className="lg:col-span-3 space-y-10">

          {/* TOP SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Ahead" value="25%" color="green" icon="success" />
            <StatCard title="On Track" value="25%" color="blue" icon="progress" />
            <StatCard title="At Risk" value="25%" color="yellow" icon="alert" />
            <StatCard title="Behind" value="25%" color="red" icon="danger" />
          </div>

          {/* CIRCULAR MILESTONE OVERVIEW */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-3">Milestone Progress</h2>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <CircularMilestoneChart completed={completed} total={4} />

              <div>
                <p className="text-gray-600 mb-3">
                  Overview of milestones & due status
                </p>
                <p className="font-semibold text-purple-600">
                  {completed} / 4 milestones completed
                </p>
              </div>
            </div>
          </div>

          {/* TIMELINE */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Milestone Timeline</h2>
            <AnimatedVerticalTimeline raw={row.raw} dueDates={DUE_MAP} />
          </div>

          {/* GANTT CHART */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-3">Gantt Timeline</h2>
            <GanttTimeline raw={row.raw} dueDates={DUE_MAP} />
          </div>

          {/* STUDENT PROGRESS TABLE */}
          <ProgressTable students={sampleStudents} />

        </div>
      </main>
    </div>
  );
}
