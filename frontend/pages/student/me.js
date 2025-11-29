import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import MilestoneGantt from "../../components/MilestoneGantt";
import SubmissionFolder from "../../components/SubmissionFolder";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

/* -------------------------------
   12-ACTIVITY PROGRESS MODEL
--------------------------------*/
const ACTIVITIES = [
  "P1 Submitted",
  "P3 Submitted",
  "P4 Submitted",
  "P5 Submitted",
  "Thesis Draft Completed",
  "Ethical Clearance Obtained",
  "Pilot or Phase 1 Completed",
  "Progress Approved",
  "Seminar & Report Submitted",
  "Phase 2 Completed",
  "1 Indexed Paper Submitted",
  "Conference Presentation",
];

function isSubmitted(val) {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  if (["", "n/a", "#n/a", "-", "—", "na"].includes(s)) return false;
  return true;
}

function calcProgress(row) {
  const done = ACTIVITIES.filter(a => isSubmitted(row[a])).length;
  return Math.round((done / ACTIVITIES.length) * 100);
}

/* ----------- STUDENT PAGE ----------- */
export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("progress");

  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) { setError("Not logged in"); setLoading(false); return; }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${API}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const text = await res.text();
        if (!res.ok) throw new Error(text);
        const data = JSON.parse(text);

        setRow(data.row);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!row) return null;

  /* -----------------------------
       Compute Progress
  ------------------------------*/
  const percentage = calcProgress(row.raw);
  const completedCount = ACTIVITIES.filter(a => isSubmitted(row.raw[a])).length;

  /* -----------------------------
       Build timeline rows
  ------------------------------*/
  const activityRows = ACTIVITIES.map(a => ({
    activity: a,
    milestone: a,
    start: row.start_date || "",
    expected: "",
    actual: row.raw[a] || ""
  }));

  const initials = (row.student_name || "")
    .split(" ")
    .map(s => s[0])
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      
      {/* HEADER */}
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <h1 className="text-4xl font-bold">Student Progress</h1>
        <p className="mt-2 text-lg">
          <strong>{row.student_name}</strong> — {row.programme}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* LEFT PANEL */}
        <div className="col-span-4 space-y-6">

          {/* PROFILE CARD */}
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
            </div>
          </div>

          {/* TABS */}
          <div className="rounded-xl bg-white shadow p-4">
            <div className="flex gap-3 border-b pb-2 text-sm font-medium text-gray-600">
              <button className={tab==="progress" ? "text-purple-700 font-bold" : ""} onClick={()=>setTab("progress")}>Progress</button>
              <button className={tab==="submissions" ? "text-purple-700 font-bold" : ""} onClick={()=>setTab("submissions")}>Submissions</button>
              <button className={tab==="reports" ? "text-purple-700 font-bold" : ""} onClick={()=>setTab("reports")}>Reports</button>
              <button className={tab==="documents" ? "text-purple-700 font-bold" : ""} onClick={()=>setTab("documents")}>Documents</button>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-8 space-y-6">

          {/* PROGRESS TAB */}
          {tab === "progress" && (
            <>
              <div className="rounded-xl bg-white p-6 shadow flex items-center gap-6">
                <DonutChart percentage={percentage} size={150} />
                <div>
                  <div className="text-4xl font-bold">{percentage}%</div>
                  <div className="text-gray-600">{completedCount} of 12 activities completed</div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-xl font-semibold text-purple-700 mb-4">Activity Gantt Chart</h3>
                <MilestoneGantt rows={activityRows} width={1100} />
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-xl font-semibold text-purple-700 mb-4">Expected vs Actual Timeline</h3>
                <TimelineTable rows={activityRows} />
              </div>
            </>
          )}

          {/* SUBMISSIONS */}
          {tab === "submissions" && (
            <SubmissionFolder
              raw={row.raw}
              extraActivities={ACTIVITIES}
            />
          )}

          {/* REPORTS */}
          {tab === "reports" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <h3 className="text-xl font-semibold text-purple-700 mb-4">Reports</h3>
              <p>No reports available.</p>
            </div>
          )}

          {/* DOCUMENTS */}
          {tab === "documents" && (
            <div className="rounded-xl bg-white p-6 shadow space-y-4">
              <h3 className="text-xl font-semibold text-purple-700 mb-4">Documents</h3>

              <a
                href="https://gamma.app/docs/PPBMS-Student-Progress-Dashboard-whsfuidye58swk3?mode=doc"
                target="_blank"
                rel="noreferrer"
                className="text-purple-600 underline"
              >
                PPBMS Dashboard Document
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
