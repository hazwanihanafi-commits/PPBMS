import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import MilestoneGantt from "../../components/MilestoneGantt";
import ActivityMapping from "../../components/ActivityMapping";
import SubmissionFolder from "../../components/SubmissionFolder";

// milestone definitions
const MILESTONE_DEFINITIONS = {
  P1: "Development Plan & Learning Contract",
  P3: "Research Logbook (Daily/Weekly)",
  P4: "Monthly Portfolio Monitoring Form",
  P5: "Annual Portfolio Review (MSc/PhD)",
};

const API = process.env.NEXT_PUBLIC_API_BASE || "";

// helper — treat garbage values as not submitted
function isSubmittedValue(val) {
  if (val === null || val === undefined) return false;
  const s = String(val).trim().toLowerCase();
  if (!s) return false;
  if (["", "n/a", "#n/a", "—", "-", "na"].includes(s)) return false;
  return true;
}

// MSc timeline (activities → start/end)
const mscTimeline = [
  { activity: "Registration & Orientation", milestone: "P1", start: "2023-01-01", end: "2023-03-31" },
  { activity: "Literature Review & Proposal Prep", milestone: "P3", start: "2023-04-01", end: "2023-12-31" },
  { activity: "Proposal Defence", milestone: "P3", start: "2023-07-01", end: "2023-09-30" },
  { activity: "Research Ethics Approval (JEPeM)", milestone: "P3", start: "2023-04-01", end: "2023-12-31" },
  { activity: "Research Implementation I", milestone: "P4", start: "2023-10-01", end: "2024-03-31" },
  { activity: "Research Implementation II", milestone: "P4", start: "2024-04-01", end: "2024-06-30" },
  { activity: "Publication I", milestone: "P4", start: "2024-04-01", end: "2024-06-30" },
  { activity: "Research Dissemination", milestone: "P4", start: "2024-07-01", end: "2024-09-30" },
  { activity: "Mid-Candidature Review", milestone: "P5", start: "2023-10-01", end: "2024-03-31" },
  { activity: "Thesis Preparation", milestone: "P5", start: "2024-07-01", end: "2024-09-30" },
  { activity: "Pre-Submission Review (JPMPMP)", milestone: "P5", start: "2024-10-01", end: "2024-12-31" },
  { activity: "Thesis Examination & Completion", milestone: "P5", start: "2024-10-01", end: "2024-12-31" },
];

// PhD timeline (activities → start/end)
const phdTimeline = [
  { activity: "Registration & Orientation", milestone: "P1", start: "2022-01-01", end: "2022-03-31" },
  { activity: "Literature Review & Proposal Prep", milestone: "P3", start: "2022-01-01", end: "2022-12-31" },
  { activity: "Proposal Defence", milestone: "P3", start: "2022-07-01", end: "2022-09-30" },
  { activity: "Research Ethics Approval (JEPeM)", milestone: "P3", start: "2022-04-01", end: "2022-12-31" },
  { activity: "Research Implementation I", milestone: "P4", start: "2023-01-01", end: "2023-03-31" },
  { activity: "Research Communication I", milestone: "P4", start: "2023-04-01", end: "2023-06-30" },
  { activity: "Research Implementation II", milestone: "P4", start: "2023-07-01", end: "2023-09-30" },
  { activity: "Publication I", milestone: "P4", start: "2024-04-01", end: "2024-06-30" },
  { activity: "Research Dissemination", milestone: "P4", start: "2024-07-01", end: "2024-09-30" },
  { activity: "Thesis Preparation", milestone: "P5", start: "2024-07-01", end: "2024-09-30" },
  { activity: "Pre-Submission Review (JPMPMP)", milestone: "P5", start: "2024-10-01", end: "2024-12-31" },
  { activity: "Thesis Examination & Completion", milestone: "P5", start: "2024-10-01", end: "2024-12-31" },
];

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("progress");

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

  // choose timeline by programme (auto-detect)
  const programmeText = (row.programme || "").toLowerCase();
  const timeline = programmeText.includes("master") || programmeText.includes("msc")
    ? mscTimeline
    : phdTimeline;

  // Build milestones to compute progress using canonical sheet keys (P1/P3/P4/P5)
  const canonical = [
    { code: "P1", expected: null, actual: row.raw?.["P1 Submitted"] || null },
    { code: "P3", expected: null, actual: row.raw?.["P3 Submitted"] || null },
    { code: "P4", expected: null, actual: row.raw?.["P4 Submitted"] || null },
    { code: "P5", expected: null, actual: row.raw?.["P5 Submitted"] || null },
  ];

  const totalMilestones = canonical.length;
  const completedCount = canonical.filter(m => isSubmittedValue(m.actual)).length;
  const percentage = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

  // Build activity rows for timeline component — include actual submission if exists
  const activityRows = timeline.map((tItem) => {
    // map milestone to actual submission date if available (sheet uses Px Submitted)
    const submittedKey = `${tItem.milestone} Submitted`;
    const actual = row.raw?.[submittedKey] || "";
    return {
      activity: tItem.activity,
      milestone: tItem.milestone,
      definition: MILESTONE_DEFINITIONS[tItem.milestone] || tItem.milestone,
      start: tItem.start,
      expected: tItem.end,
      actual,
    };
  });

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
              <div><strong>Supervisor:</strong> {row.supervisor}</div>
              <div><strong>Email:</strong> {row.email}</div>
              <div><strong>Start Date:</strong> {row.start_date || "—"}</div>
              <div><strong>Field:</strong> {row.field || "—"}</div>
              <div><strong>Department:</strong> {row.department || "—"}</div>
              {/* STATUS line intentionally removed per request */}
            </div>
          </div>

          <div className="rounded-xl bg-white shadow p-4">
            <div className="flex gap-3 border-b pb-2 text-sm font-medium text-gray-600">
              <button className={tab === "progress" ? "text-purple-700 font-bold" : ""} onClick={() => setTab("progress")}>Progress</button>
              <button className={tab === "submissions" ? "text-purple-700 font-bold" : ""} onClick={() => setTab("submissions")}>Submissions</button>
              <button className={tab === "reports" ? "text-purple-700 font-bold" : ""} onClick={() => setTab("reports")}>Reports</button>
              <button className={tab === "documents" ? "text-purple-700 font-bold" : ""} onClick={() => setTab("documents")}>Documents</button>
            </div>
          </div>
        </div>

        <div className="col-span-8 space-y-6">
          {tab === "progress" && (
            <>
              <div className="rounded-xl bg-white p-6 shadow flex items-center gap-6">
                <DonutChart percentage={percentage} size={150} />
                <div>
                  <div className="text-4xl font-bold">{percentage}%</div>
                  <div className="text-gray-600">{completedCount} of {totalMilestones} milestones completed</div>
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
            </>
          )}

          {tab === "submissions" && <SubmissionFolder raw={row.raw} />}

          {tab === "reports" && (
            <div className="rounded-xl bg-white p-6 shadow text-gray-600">
              <h3 className="text-xl font-semibold text-purple-700 mb-4">Reports</h3>
              <p>No reports available yet.</p>
            </div>
          )}

          {tab === "documents" && (
            <div className="rounded-xl bg-white p-6 shadow space-y-3">
              <h3 className="text-xl font-semibold text-purple-700 mb-4">Documents</h3>
              <a target="_blank" rel="noreferrer" href="https://gamma.app/docs/PPBMS-Student-Progress-Dashboard-whsfuidye58swk3?mode=doc" className="text-purple-600 hover:underline block">
                PPBMS Student Progress Dashboard (Doc)
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
