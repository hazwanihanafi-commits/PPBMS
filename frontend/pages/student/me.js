// pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import MilestoneGantt from "../../components/MilestoneGantt";
import ActivityMapping from "../../components/ActivityMapping";
import SubmissionFolder from "../../components/SubmissionFolder";

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

  // Load token
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    setToken(t);
  }, []);

  // Fetch student data
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${API}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const txt = await res.text();
        if (!res.ok) throw new Error(txt);

        const data = JSON.parse(txt);
        setRow(data.row);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-10">Loading…</div>;
  if (error) return <div className="p-10 text-red-600">{error}</div>;
  if (!row) return null;

  // Progress
  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(x => x && x.trim() !== "").length;

  const percentage = Math.round((completed / 4) * 100);

  // Milestone rows
  const milestones = [
    { key: "P1 Submitted", milestone: "P1" },
    { key: "P3 Submitted", milestone: "P3" },
    { key: "P4 Submitted", milestone: "P4" },
    { key: "P5 Submitted", milestone: "P5" },
  ].map(m => ({
    milestone: m.milestone,
    expected: DUE[m.key],
    actual: row.raw[m.key] || "",
    start: row.start_date,
    definition: `${m.milestone} — ${DUE[m.key]}`,
  }));

  const initials = row.student_name
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* HEADER */}
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <h1 className="text-4xl font-bold">Student Progress</h1>
        <p className="mt-2 text-lg">
          <strong>{row.student_name}</strong> — {row.programme}
        </p>
      </div>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-12 gap-6">

        {/* LEFT PANEL */}
        <div className="col-span-4 space-y-6">

          {/* PROFILE CARD */}
          <div className="rounded-xl bg-white p-6 shadow space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center
                              bg-gradient-to-br from-purple-600 to-pink-500 
                              text-white text-xl font-bold">
                {initials}
              </div>

              <div>
                <div className="font-semibold text-lg">{row.student_name}</div>
                <div className="text-gray-600 text-sm">{row.programme}</div>
              </div>
            </div>

            <div className="text-sm space-y-1">
              <div><strong>Supervisor:</strong> {row.supervisor || "—"}</div>
              <div><strong>Email:</strong> {row.email}</div>
              <div><strong>Start Date:</strong> {row.start_date || "—"}</div>
              <div><strong>Field:</strong> {row.field || "—"}</div>
              <div><strong>Department:</strong> {row.department || "—"}</div>
              <div><strong>Status:</strong> {row.raw["Status P"]}</div>
            </div>
          </div>

          {/* SUBMISSION FOLDER */}
          <SubmissionFolder raw={row.raw} />

          {/* RESOURCES */}
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold mb-2">Resources</h3>
            <a className="text-purple-600 hover:underline" target="_blank" 
               href="https://gamma.app/docs/PPBMS-Student-Progress-Dashboard-whsfuidye58swk3?mode=doc">
              PPBMS Student Progress Dashboard (Doc)
            </a>
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-8 space-y-6">

          {/* DONUT PROGRESS */}
          <div className="rounded-xl bg-white p-6 shadow flex items-center gap-6">
            <DonutChart percentage={percentage} size={150} />
            <div>
              <div className="text-4xl font-bold">{percentage}%</div>
              <div className="text-gray-600">{completed} of 4 milestones completed</div>
            </div>
          </div>

          {/* GANTT */}
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Milestone Gantt Chart</h3>
            <MilestoneGantt rows={milestones} width={900} />
          </div>

          {/* TIMELINE TABLE */}
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Expected vs Actual Timeline</h3>
            <TimelineTable rows={milestones} />
          </div>

          {/* ACTIVITY MAP */}
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Activity → Milestone Mapping</h3>
            <ActivityMapping />
          </div>

        </div>
      </div>
    </div>
  );
}
