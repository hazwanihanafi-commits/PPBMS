// frontend/pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart"; // keep your existing DonutChart
import TimelineTable from "../../components/TimelineTable"; // existing
import { calculateProgress } from "../../utils/calcProgress";
import SubmissionFolder from "../../components/SubmissionFolder";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("progress");

  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) { setLoading(false); return; }
    setToken(t);
  }, []);

  async function fetchRow() {
    setLoading(true);
    try {
      const tokenLocal = localStorage.getItem("ppbms_token");
      const res = await fetch(`${API}/api/student/me`, { headers: { Authorization: `Bearer ${tokenLocal}` }});
      const txt = await res.text();
      if (!res.ok) throw new Error(txt);
      const data = JSON.parse(txt);
      setRow(data.row);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) fetchRow();
  }, [token]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!row) return <div className="p-6 text-red-600">No student data found or not logged in.</div>;

  const prog = calculateProgress(row.raw || {}, row.programme || "");
  const activityRows = prog.items.map(it => ({
    activity: it.label,
    expected: "", // you can implement expected auto-calculation from start date later
    actual: row.raw?.[it.key] || "",
    status: it.done ? "Completed" : "Pending",
    remaining: it.done ? "" : "—"
  }));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Student Progress</h1>
        <p className="mt-2 text-lg"><strong>{row.student_name}</strong> — {row.programme}</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="text-lg font-semibold mb-2">Overview</div>
            <div><strong>Supervisor:</strong> {row.raw?.["Main Supervisor"] || row.raw?.["Main Supervisor's Email"]}</div>
            <div><strong>Start Date:</strong> {row.start_date || "—"}</div>
            <div className="mt-4">
              <DonutChart percentage={prog.percentage} size={120} />
              <div className="mt-2 text-sm">{prog.percentage}% — {prog.doneCount} of {prog.total} items done</div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4">
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
              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-xl font-semibold text-purple-700 mb-4">Expected vs Actual</h3>
                <TimelineTable rows={activityRows} />
              </div>
            </>
          )}

          {tab === "submissions" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <SubmissionFolder raw={row.raw || {}} studentEmail={row.email} onUpdated={fetchRow} />
            </div>
          )}

          {tab === "documents" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <h3 className="text-xl font-semibold text-purple-700 mb-4">Documents</h3>
              <a className="text-purple-600 hover:underline" target="_blank" rel="noreferrer" href="https://gamma.app/docs/PPBMS-Student-Progress-Dashboard-whsfuidye58swk3?mode=doc">PPBMS Dashboard Doc</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
