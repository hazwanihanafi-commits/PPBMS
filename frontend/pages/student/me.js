// frontend/pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import SubmissionFolder from "../../components/SubmissionFolder";
import { calculateProgressFromPlan, MSC_PLAN, PHD_PLAN } from "../../utils/calcProgress";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

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
        const res = await fetch(`${API}/api/student/me`, { headers: { Authorization: `Bearer ${token}` }});
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
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!row) return null;

  const prog = calculateProgressFromPlan(row.raw || {}, row.programme || "");
  const percentage = prog.percentage;
  const completedCount = prog.doneCount;
  const totalCount = prog.total;

  // build "expected vs actual" table rows
  const activityRows = prog.items.map(i => ({
    activity: i.label,
    expected: i.expected || row.raw?.[`${i.key} Expected`] || "",
    actual: i.actual || "",
    status: i.status || ""
  }));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white">
        <h1 className="text-3xl font-bold">Student Progress</h1>
        <p className="mt-1"><strong>{row.student_name}</strong> — {row.programme}</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="font-semibold text-lg">{row.student_name}</div>
            <div className="text-sm text-gray-600">{row.programme}</div>
            <div className="mt-3 text-sm space-y-1">
              <div><strong>Supervisor:</strong> {row.raw?.["Main Supervisor"] || row.raw?.["Main Supervisor's Name"] || "—"}</div>
              <div><strong>Email:</strong> {row.raw?.["Student's Email"] || row.email}</div>
              <div><strong>Start Date:</strong> {row.start_date || "—"}</div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <div className="flex gap-2">
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
                <DonutChart percentage={percentage} size={140} />
                <div>
                  <div className="text-3xl font-bold">{percentage}%</div>
                  <div className="text-gray-600">{completedCount} of {totalCount} items completed</div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-lg font-semibold mb-3">Expected vs Actual</h3>
                <TimelineTable rows={activityRows} />
              </div>
            </>
          )}

          {tab === "submissions" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <SubmissionFolder raw={row.raw || {}} studentEmail={row.raw?.["Student's Email"] || row.email} />
            </div>
          )}

          {tab === "documents" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <a className="text-purple-600" href="https://gamma.app/docs/PPBMS-Student-Progress-Dashboard-whsfuidye58swk3?mode=doc" target="_blank" rel="noreferrer">PPBMS Student Progress Dashboard (Doc)</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
