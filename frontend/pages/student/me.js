// pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import MilestoneGantt from "../../components/MilestoneGantt";
import SubmissionFolder from "../../components/SubmissionFolder";
import {
  calculateProgressFromPlan,
  buildTimelineRows,
} from "../../utils/calcProgress";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("progress");

  // load token
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    setToken(t);
  }, []);

  // fetch student/me
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

  const raw = row.raw || {};

  // progress based on MSc/PhD plan
  const prog = calculateProgressFromPlan(raw, row.programme);
  const percentage = prog.percentage;
  const completedCount = prog.done;
  const totalCount = prog.total;

  // timeline / gantt rows based on year/quarter mapping
  const timelineRows = buildTimelineRows(raw, row.start_date, row.programme);

  const initials = (row.student_name || "NA")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const supervisorName =
    row.supervisor ||
    row["Main Supervisor"] ||
    raw["Main Supervisor"] ||
    raw["Main Supervisor's Name"] ||
    raw["Main Supervisor's Email"] ||
    "—";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Student Progress</h1>
        <p className="mt-2 text-lg">
          <strong>{row.student_name}</strong> — {row.programme}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT PANEL */}
        <div className="col-span-4 space-y-6">
          {/* Profile */}
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
              <div>
                <strong>Supervisor:</strong> {supervisorName}
              </div>
              <div>
                <strong>Email:</strong> {row.email}
              </div>
              <div>
                <strong>Start Date:</strong> {row.start_date || "—"}
              </div>
              <div>
                <strong>Field:</strong> {row.field || "—"}
              </div>
              <div>
                <strong>Department:</strong> {row.department || "—"}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-xl bg-white shadow p-4">
            <div className="flex gap-3 border-b pb-2 text-sm font-medium text-gray-600">
              <button
                className={tab === "progress" ? "text-purple-700 font-bold" : ""}
                onClick={() => setTab("progress")}
              >
                Progress
              </button>
              <button
                className={tab === "submissions" ? "text-purple-700 font-bold" : ""}
                onClick={() => setTab("submissions")}
              >
                Submissions
              </button>
              <button
                className={tab === "reports" ? "text-purple-700 font-bold" : ""}
                onClick={() => setTab("reports")}
              >
                Reports
              </button>
              <button
                className={tab === "documents" ? "text-purple-700 font-bold" : ""}
                onClick={() => setTab("documents")}
              >
                Documents
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-8 space-y-6">
          {/* TAB: PROGRESS */}
          {tab === "progress" && (
            <>
              <div className="rounded-xl bg-white p-6 shadow flex items-center gap-6">
                <DonutChart percentage={percentage} size={150} />
                <div>
                  <div className="text-4xl font-bold">{percentage}%</div>
                  <div className="text-gray-600">
                    {completedCount} of {totalCount} required stages completed
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-xl font-semibold text-purple-700 mb-4">
                  Milestone Gantt Chart (MSc / PhD Timeline)
                </h3>
                <MilestoneGantt rows={timelineRows} width={1000} />
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-xl font-semibold text-purple-700 mb-4">
                  Expected vs Actual Timeline
                </h3>
                <TimelineTable rows={timelineRows} />
              </div>
            </>
          )}

          {/* TAB: SUBMISSIONS */}
          {tab === "submissions" && (
            <div className="rounded-xl bg-white p-6 shadow">
              {/* SubmissionFolder can later show which of the evidence stages have files:
                 - Development Plan & Learning Contract
                 - Annual Progress Review (Y1/Y2)
                 - Internal Evaluation Completed
                 - Final Thesis Submission
               */}
              <SubmissionFolder raw={raw} studentEmail={row.email} />
            </div>
          )}

          {/* TAB: REPORTS */}
          {tab === "reports" && (
            <div className="rounded-xl bg-white p-6 shadow text-gray-600">
              <h3 className="text-xl font-semibold text-purple-700 mb-4">
                Reports
              </h3>
              <p>No reports available yet.</p>
            </div>
          )}

          {/* TAB: DOCUMENTS */}
          {tab === "documents" && (
            <div className="rounded-xl bg-white p-6 shadow space-y-3">
              <h3 className="text-xl font-semibold text-purple-700 mb-4">
                Documents
              </h3>
              <a
                target="_blank"
                rel="noreferrer"
                className="text-purple-600 hover:underline block"
                href="https://gamma.app/docs/PPBMS-Student-Progress-Dashboard-whsfuidye58swk3?mode=doc"
              >
                PPBMS Student Progress Dashboard (Doc)
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
