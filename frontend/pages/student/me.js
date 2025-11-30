// frontend/pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import MilestoneGantt from "../../components/MilestoneGantt";
import SubmissionFolder from "../../components/SubmissionFolder";
import { calculateProgress } from "../../utils/calcProgress";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("progress");

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("ppbms_token") : null;
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
        // server should return { row: {...}, raw: {...} } or at least { row: {...} }
        setRow(data.row || data);
      } catch (err) {
        setError(err.message || "Failed to fetch student row");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!row) return <div className="p-6">No data available.</div>;

  // calculate progress based on plan (msc vs phd)
  const raw = row.raw || row; // graceful: some endpoints return row.raw
  const prog = calculateProgress(raw, row.programme || "");
  const percentage = prog.percentage;
  const completedCount = prog.doneCount;
  const totalCount = prog.total;

  // build activityRows for gantt/timeline from the plan items
  const activityRows = prog.items.map((it) => ({
    activity: it.label,
    milestone: it.label,
    definition: it.label,
    start: row.start_date || "",
    expected: "", // optional: map to sheet fields if available
    actual: raw[it.key] || (it.done ? raw[`${it.key} Date`] || "" : ""),
  }));

  const initials = (row.student_name || "")
    .split(" ")
    .map((s) => s[0] || "")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "NA";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Student Progress</h1>
        <p className="mt-2 text-lg">
          <strong>{row.student_name}</strong> — {row.programme}
        </p>
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
              <div>
                <strong>Supervisor:</strong>{" "}
                {row.supervisor || raw["Main Supervisor"] || raw["Main Supervisor's Name"] || "—"}
              </div>
              <div>
                <strong>Email:</strong> {row.email || raw["Student's Email"] || "—"}
              </div>
              <div>
                <strong>Start Date:</strong> {row.start_date || raw["Start Date"] || "—"}
              </div>
              <div>
                <strong>Field:</strong> {row.field || raw["Field"] || "—"}
              </div>
              <div>
                <strong>Department:</strong> {row.department || raw["Department"] || "—"}
              </div>
            </div>
          </div>

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

        <div className="col-span-8 space-y-6">
          {tab === "progress" && (
            <>
              <div className="rounded-xl bg-white p-6 shadow flex items-center gap-6">
                <DonutChart percentage={percentage} size={150} />
                <div>
                  <div className="text-4xl font-bold">{percentage}%</div>
                  <div className="text-gray-600">
                    {completedCount} of {totalCount} items completed
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-xl font-semibold text-purple-700 mb-4">Milestone Gantt Chart</h3>
                <MilestoneGantt rows={activityRows} width={1000} />
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-xl font-semibold text-purple-700 mb-4">Expected vs Actual Timeline</h3>
                <TimelineTable rows={activityRows} />
              </div>
            </>
          )}

          {tab === "submissions" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <SubmissionFolder raw={raw} studentEmail={row.email || raw["Student's Email"]} />
            </div>
          )}

          {tab === "reports" && (
            <div className="rounded-xl bg-white p-6 shadow text-gray-600">
              <h3 className="text-xl font-semibold text-purple-700 mb-4">Reports</h3>
              <p>No reports available yet.</p>
            </div>
          )}

          {tab === "documents" && (
            <div className="rounded-xl bg-white p-6 shadow space-y-3">
              <h3 className="text-xl font-semibold text-purple-700 mb-4">Documents</h3>
              <p>
                The research logbook and other personal records are kept under Documents. (You asked to move logbook to Documents.)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
