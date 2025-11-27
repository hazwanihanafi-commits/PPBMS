// pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import MilestoneGantt from "../../components/MilestoneGantt";
import ActivityMapping from "../../components/ActivityMapping";

const API = process.env.NEXT_PUBLIC_API_BASE;

const DUE = {
  "P1 Submitted": "2024-08-31",
  "P3 Submitted": "2025-01-31",
  "P4 Submitted": "2025-02-15",
  "P5 Submitted": "2025-10-01",
};

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------------------- LOAD TOKEN ----------------------
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    setToken(t);
  }, []);

  // ---------------------- GET STUDENT DATA ----------------------
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

  if (loading) return <div className="p-10">Loading…</div>;
  if (error) return <div className="p-10 text-red-600">Error: {error}</div>;
  if (!row) return null;

  // ---------------------- CALCULATE PROGRESS ----------------------
  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(Boolean).length;

  const percentage = Math.round((completed / 4) * 100);

  // ---------------------- PREP TIMELINE TABLE ----------------------
  const milestones = [
    { key: "P1 Submitted", milestone: "P1" },
    { key: "P3 Submitted", milestone: "P3" },
    { key: "P4 Submitted", milestone: "P4" },
    { key: "P5 Submitted", milestone: "P5" },
  ].map(m => ({
    milestone: m.milestone,
    expected: DUE[m.key] || "—",
    actual: row.raw[m.key] || "—",
    start: row.start_date || "—"
  }));

  const initials = (row.student_name || "NA")
    .split(" ")
    .map(s => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // ---------------------- RENDER UI ----------------------
  return (
    <div className="dashboard-container">

      {/* LEFT PANEL */}
      <div className="left-panel">

        <div className="gradient-header">
          <h1 className="text-2xl font-bold text-white">Student Progress</h1>
          <div className="text-sm text-white/90">
            {row.student_name} — {row.programme}
          </div>
        </div>

        {/* Profile Card */}
        <div className="ppbms-card">
          <div className="flex items-center gap-4">
            <div className="profile-avatar">{initials}</div>
            <div>
              <div className="text-lg font-bold">{row.student_name}</div>
              <div className="text-sm opacity-70">{row.programme}</div>
            </div>
          </div>

          <div className="mt-4 text-sm space-y-1">
            <div><strong>Supervisor:</strong> {row.supervisor}</div>
            <div><strong>Email:</strong> {row.email}</div>
            <div><strong>Start Date:</strong> {row.start_date || "—"}</div>
            <div><strong>Status:</strong> {row.raw["Status P"] || "—"}</div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">

        {/* Donut Progress */}
        <div className="ppbms-card">
          <h3 className="section-title">Overall Progress</h3>
          <div className="donut-wrapper">
            <DonutChart percentage={percentage} size={150} />
            <div>
              <div className="text-4xl font-semibold">{percentage}%</div>
              <div className="text-gray-600 mt-1">{completed} of 4 milestones completed</div>
            </div>
          </div>
        </div>

        {/* Gantt Chart */}
        <div className="ppbms-card">
          <h3 className="section-title">Milestone Gantt Chart</h3>
          <MilestoneGantt rows={milestones} width={800} />
        </div>

        {/* Expected vs Actual */}
        <div className="ppbms-card">
          <h3 className="section-title">Expected vs Actual Timeline</h3>
          <TimelineTable rows={milestones} />
        </div>

        {/* Activity Mapping */}
        <div className="ppbms-card">
          <h3 className="section-title">Activity → Milestone Mapping</h3>
          <ActivityMapping />
        </div>

      </div>
    </div>
  );
}
