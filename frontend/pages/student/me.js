// frontend/pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import MilestoneGantt from "../../components/MilestoneGantt";
import SubmissionFolder from "../../components/SubmissionFolder";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

// treat garbage values as not submitted
function isSubmittedValue(val) {
  if (val === null || val === undefined) return false;
  const s = String(val).trim().toLowerCase();
  if (!s) return false;
  if (["", "n/a", "#n/a", "—", "-", "na"].includes(s)) return false;
  return true;
}

function calculateProgressFrom12(row) {
  const activities = [
    "P1 Submitted",
    "P3 Submitted",
    "P4 Submitted",
    "P5 Submitted",
    "Thesis Draft Completed",
    "Ethical clearance obtained",
    "Pilot or Phase 1 completed",
    "Progress approved",
    "Seminar & report submitted",
    "Phase 2 completed",
    "1 indexed paper submitted",
    "Conference presentation"
  ];

  const done = activities.filter(a => {
    const v = row?.[a];
    if (!v) return false;
    const s = String(v).trim().toLowerCase();
    if (!s) return false;
    if (["", "n/a", "na", "#n/a", "-", "—"].includes(s)) return false;
    return true;
  }).length;

  return {
    done,
    total: activities.length,
    percentage: Math.round((done / activities.length) * 100)
  };
}

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    setToken(t);
  }, []);

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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!row) return null;

  // compute using 12-activity function
  const calc = calculateProgressFrom12(row.raw || {});
  const percentage = calc.percentage;
  const done = calc.done;
  const total = calc.total;

  // prepare simple activity rows for timeline / Gantt — map your activity table to simpler rows
  // For display we reuse existing timetable arrays or create simple rows from sheet keys:
  const activityRows = [
    { activity: "Registration & Orientation", milestone: "P1", expected: row.raw?.["Expected Date P1"] || "", actual: row.raw?.["Submission Date P1"] || "" },
    { activity: "Literature Review & Proposal Preparation", milestone: "P3", expected: row.raw?.["Expected Date P3"] || "", actual: row.raw?.["Submission Date P3"] || "" },
    { activity: "Proposal Defence", milestone: "P3", expected: "", actual: row.raw?.["Submission Date P3"] || "" },
    { activity: "Research Ethics Approval (JEPeM)", milestone: "P3", expected: "", actual: "" },
    // ... add other mapping as you like (kept short here)
  ];

  const initials = (row.student_name || "NA")
    .split(" ")
    .map(s => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <h1 className="text-4xl font-bold">Student Progress</h1>
        <p className="mt-2 text-lg"><strong>{row.student_name}</strong> — {row.programme}</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 text-white text-xl font-bold">
                {initials}
              </div>
              <div>
                <div className="font-semibold text-lg">{row.student_name}</div>
                <div className="text-gray-600 text-sm">{row.programme}</div>
              </div>
            </div>

            <div className="text-sm space-y-1">
              <div><strong>Main Supervisor:</strong> {row["Main Supervisor"] || row.supervisor || "—"}</div>
              <div><strong>Email:</strong> {row.email}</div>
              <div><strong>Start Date:</strong> {row.start_date || "—"}</div>
              <div><strong>Field:</strong> {row.field || "—"}</div>
              <div><strong>Department:</strong> {row.department || "—"}</div>
            </div>
          </div>
        </div>

        <div className="col-span-8 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow flex items-center gap-6">
            <DonutChart percentage={percentage} size={150} />
            <div>
              <div className="text-4xl font-bold">{percentage}%</div>
              <div className="text-gray-600">{done} of {total} activities completed</div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Milestone Gantt Chart</h3>
            <MilestoneGantt rows={activityRows} width={1100} />
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Expected vs Actual Timeline</h3>
            <TimelineTable rows={activityRows} />
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Submission Folder</h3>
            <SubmissionFolder raw={row.raw || {}} />
          </div>

        </div>
      </div>
    </div>
  );
}
