// frontend/pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import SubmissionFolder from "../../components/SubmissionFolder";
import { calculateProgressFromPlan as calcFromPlan, MSC_PLAN, PHD_PLAN, calculateProgressFromPlan } from "../../utils/calcProgress";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("progress");
  const [error, setError] = useState(null);

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
      } catch (e) {
        setError(e.message || e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!row) return null;

  const prog = calculateProgressFromPlan(row.raw || {}, row.programme || "");
  const percentage = prog.percentage;
  const completedCount = prog.doneCount;
  const total = prog.total;

  // Build table rows for timeline view: expected = computed from start_date per programme (auto timeline)
  const planItems = prog.items.map((it, idx) => {
    // expected date: simple auto-schedule based on start date and index - you can replace with real logic
    const startDate = row.start_date ? new Date(row.start_date) : null;
    let expected = "";
    if (startDate) {
      // distribute across years (simple heuristic)
      const daysOffset = Math.round((idx + 1) * (isNaN(total) ? 90 : Math.round(( (row.programme || "").toLowerCase().includes("msc") ? 730 : 1095) / total )));
      const d = new Date(startDate);
      d.setDate(d.getDate() + daysOffset);
      expected = d.toISOString().slice(0, 10);
    }
    return {
      milestone: it.label,
      expected,
      actual: row.raw?.[it.key] || ""
    };
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow">
        <h1 className="text-3xl font-bold">Student Progress</h1>
        <p className="mt-2 text-lg"><strong>{row.student_name}</strong> — {row.programme}</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="text-lg font-semibold">{row.student_name}</div>
            <div className="text-sm text-gray-600">{row.programme}</div>
            <div className="mt-3 text-sm">
              <div><strong>Supervisor:</strong> {row.raw?.["Main Supervisor"] || row.raw?.["Main Supervisor's Name"] || row.supervisor || "—"}</div>
              <div><strong>Start Date:</strong> {row.start_date || "—"}</div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 mt-4">
            <div className="flex gap-2">
              <button onClick={() => setTab("progress")} className={tab==="progress"?"font-bold text-purple-700":""}>Progress</button>
              <button onClick={() => setTab("submissions")} className={tab==="submissions"?"font-bold text-purple-700":""}>Submissions</button>
            </div>
          </div>
        </div>

        <div className="col-span-8 space-y-4">
          {tab === "progress" && (
            <>
              <div className="rounded-xl bg-white p-6 shadow flex items-center gap-6">
                <DonutChart percentage={percentage} size={140} />
                <div>
                  <div className="text-3xl font-bold">{percentage}%</div>
                  <div className="text-gray-600">{completedCount} of {total} items completed</div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-lg font-semibold text-purple-700 mb-3">Expected vs Actual</h3>
                <TimelineTable rows={planItems} />
              </div>
            </>
          )}

          {tab === "submissions" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <SubmissionFolder raw={row.raw || {}} studentEmail={row.email} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
