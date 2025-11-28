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

  // -------- LOAD TOKEN ----------
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    setToken(t);
  }, []);

  // -------- GET STUDENT DATA ----------
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await fetch(`${API}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const rawText = await r.text();
        if (!r.ok) throw new Error(rawText);

        const data = JSON.parse(rawText);

        if (!data?.row) throw new Error("No student record found");
        setRow(data.row);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // -------- LOADING / ERROR STATES ----------
  if (loading) return <div className="p-10">Loading…</div>;

  if (error)
    return (
      <div className="p-10 text-red-600">
        <h2 className="font-bold text-xl mb-2">Error</h2>
        <div>{error}</div>
        <div className="mt-4 text-gray-600">
          Try logging in again or contact admin.
        </div>
      </div>
    );

  if (!row) return <div className="p-10">No data found.</div>;

  // ---------------------- CALCULATE PROGRESS ----------------------
const completed = [
  row?.raw?.["P1 Submitted"],
  row?.raw?.["P3 Submitted"],
  row?.raw?.["P4 Submitted"],
  row?.raw?.["P5 Submitted"],
].filter(x => x && x.trim() !== "").length;

const percentage = Math.round((completed / 4) * 100);


  // -------- TIMELINE TABLE DATA ----------
  const milestones = [
  { key: "P1 Submitted", label: "P1" },
  { key: "P3 Submitted", label: "P3" },
  { key: "P4 Submitted", label: "P4" },
  { key: "P5 Submitted", label: "P5" },
].map(m => ({
  milestone: m.label,
  expected: DUE[m.key] || "—",
  actual: row?.raw?.[m.key] || "—",   // submission date
  status: row?.status || "—",
  start: row.start_date || "—",
}));

  const initials = (row?.student_name || "NA")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // -------- UI ----------
  return (
    <div className="dashboard-container">
      {/* LEFT PANEL */}
      <div className="left-panel">
        <div className="gradient-header">
          <h1 className="text-2xl font-bold text-white">Student Progress</h1>
          <div className="text-sm text-white/90">
            <strong>{row.student_name}</strong> — {row.programme}
          </div>
        </div>

        {/* Profile Card */}
        <div className="ppbms-card">
          <div className="flex items-center gap-4">
            <div className="profile-avatar">{initials}</div>
            <div>
              <div className="text-lg font-bold">{row?.student_name}</div>
              <div className="text-sm opacity-70">{row?.programme}</div>
            </div>
          </div>

          <div className="mt-4 text-sm space-y-1">
            <div><strong>Supervisor:</strong> {row?.supervisor || "—"}</div>
            <div><strong>Email:</strong> {row?.email || "—"}</div>
            <div><strong>Start Date:</strong> {row?.start_date || "—"}</div>
            <div><strong>Status:</strong> {row?.raw?.["Status P"] || "—"}</div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <div className="ppbms-card">
          <h3 className="section-title">Overall Progress</h3>
          <div className="donut-wrapper">
            <DonutChart percentage={percentage} size={150} />
            <div>
              <div className="text-4xl font-semibold">{percentage}%</div>
              <div className="text-gray-600 mt-1">
                {completed} of 4 milestones completed
              </div>
            </div>
          </div>
        </div>

        <div className="ppbms-card">
          <h3 className="section-title">Milestone Gantt Chart</h3>
          <MilestoneGantt rows={milestones} width={800} />
        </div>

        <div className="ppbms-card">
          <h3 className="section-title">Expected vs Actual Timeline</h3>
          <TimelineTable rows={milestones} />
        </div>

        <div className="ppbms-card">
          <h3 className="section-title">Activity → Milestone Mapping</h3>
          <ActivityMapping />
        </div>
      </div>
    </div>
  );
}
