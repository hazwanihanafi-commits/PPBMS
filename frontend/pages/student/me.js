// frontend/pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import MilestoneGantt from "../../components/MilestoneGantt";
import { calculateProgress } from "../../utils/calcProgress";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

function SubmissionFolder({ raw = {}, studentEmail = "" }) {
  // Simple display of submission document links (sheet columns)
  const docs = [
    { key: "Submission Document P1", label: "P1 Document" },
    { key: "Submission Document P3", label: "P3 Document" },
    { key: "Submission Document P4", label: "P4 Document" },
    { key: "Submission Document P5", label: "P5 Document" }
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Submission Documents</h3>
      <ul className="list-disc pl-6">
        {docs.map(d => {
          const url = raw[d.key] || raw[d.key + " URL"] || "";
          return (
            <li key={d.key} className="mb-1">
              {d.label}: {url ? <a className="text-purple-600" href={url} target="_blank" rel="noreferrer">Open</a> : <span className="text-gray-500">No file</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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
        const res = await fetch(`${API}/api/student/me`, { headers: { Authorization: `Bearer ${token}` } });
        const txt = await res.text();
        if (!res.ok) throw new Error(txt);
        const data = JSON.parse(txt);
        setRow(data.row);
      } catch (err) {
        setError(err.message);
      } finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!row) return null;

  const prog = calculateProgress(row.raw || {}, row.programme || "");
  const percentage = prog.percentage;
  const completedCount = prog.doneCount;
  const totalCount = prog.total;

  // Build activityRows for Gantt / timeline (expected dates can be mapped from sheet if available)
  const activityRows = prog.items.map((it) => ({
    activity: it.label,
    milestone: it.label,
    definition: it.label,
    start: row.start_date || "",
    expected: row.raw?.[it.key + " Expected"] || "", // optional mapping
    actual: row.raw?.[it.key + " Date"] || row.raw?.[it.key] || ""
  }));

  const initials = (row.student_name || "NA").split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Student Progress</h1>
        <p className="mt-2 text-lg"><strong>{row.student_name}</strong> — {row.programme}</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 text-white text-xl font-bold">{initials}</div>
              <div>
                <div className="font-semibold text-lg">{row.student_name}</div>
                <div className="text-gray-600 text-sm">{row.programme}</div>
              </div>
            </div>

            <div className="text-sm mt-4 space-y-1">
              <div><strong>Supervisor:</strong> {row.raw?.["Main Supervisor"] || row.raw?.["Main Supervisor's Name"] || "—"}</div>
              <div><strong>Email:</strong> {row.email}</div>
              <div><strong>Start Date:</strong> {row.start_date || "—"}</div>
              <div><strong>Field:</strong> {row.raw?.Field || row.field || "—"}</div>
              <div><strong>Department:</strong> {row.raw?.Department || row.department || "—"}</div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <div className="flex gap-3 border-b pb-2 text-sm font-medium text-gray-600">
              <button className={tab === "progress" ? "text-purple-700 font-bold" : ""} onClick={() => setTab("progress")}>Progress</button>
              <button className={tab === "submissions" ? "text-purple-700 font-bold" : ""} onClick={() => setTab("submissions")}>Submissions</button>
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
                  <div className="text-gray-600">{completedCount} of {totalCount} items completed</div>
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
              <SubmissionFolder raw={row.raw} studentEmail={row.email} />
            </div>
          )}

          {tab === "documents" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <h3 className="text-xl font-semibold text-purple-700 mb-4">Documents</h3>
              <p className="text-sm">Research Logbook (Weekly) is considered a personal record — please upload under Documents if needed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
