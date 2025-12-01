// frontend/pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import SubmissionFolder from "../../components/SubmissionFolder";
import { calculateProgress } from "../../utils/calcProgress";

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
        console.error(e);
      } finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!row) return <div className="p-6 text-red-600">No student data</div>;

  const prog = calculateProgress(row.raw || {}, row.programme || "");
  const initials = (row.student_name || "NA").split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase();

  // build timeline rows (Expected date auto-computed from start-date by simple rule)
  const expectedBase = row.start_date ? new Date(row.start_date) : new Date();
  const timelineRows = prog.items.map((it, idx) => {
    // expected = add months proportional to idx over total years (MSc 24 mo, PhD 36 mo)
    const monthsTotal = (row.programme || "").toLowerCase().includes("msc") ? 24 : 36;
    const expectedDate = new Date(expectedBase);
    const step = Math.floor((monthsTotal / prog.total) * idx);
    expectedDate.setMonth(expectedDate.getMonth() + step);
    const expected = expectedDate.toISOString().slice(0,10);
    return {
      activity: it.label,
      expected,
      actual: it.actual || "",
      status: it.isDone ? "Completed" : (new Date() > new Date(expected) ? "Delayed" : "On Track"),
      remaining: it.isDone ? "-" : Math.max(0, Math.ceil((new Date(expected) - new Date())/(1000*60*60*24)))
    };
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Student Progress</h1>
        <p className="mt-2"><strong>{row.student_name}</strong> — {row.programme}</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 text-white text-xl font-bold">{initials}</div>
              <div>
                <div className="font-semibold text-lg">{row.student_name}</div>
                <div className="text-gray-600 text-sm">{row.programme}</div>
                <div className="text-sm text-gray-600 mt-1">Field: {row.field || "—"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white shadow p-4">
            <div className="flex gap-3 border-b pb-2 text-sm font-medium text-gray-600">
              <button onClick={() => setTab("progress")} className={tab==="progress"?"text-purple-700 font-bold":""}>Progress</button>
              <button onClick={() => setTab("submissions")} className={tab==="submissions"?"text-purple-700 font-bold":""}>Submissions</button>
              <button onClick={() => setTab("documents")} className={tab==="documents"?"text-purple-700 font-bold":""}>Documents</button>
            </div>
          </div>
        </div>

        <div className="col-span-8 space-y-6">
          {tab === "progress" && (
            <>
              <div className="rounded-xl bg-white p-6 shadow flex items-center gap-6">
                <DonutChart percentage={prog.percentage} size={140} />
                <div>
                  <div className="text-3xl font-bold">{prog.percentage}%</div>
                  <div className="text-gray-600">{prog.doneCount} of {prog.total} activities completed</div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-lg font-semibold text-purple-700 mb-3">Activity Timeline</h3>
                <TimelineTable rows={timelineRows} />
              </div>
            </>
          )}

          {tab === "submissions" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <SubmissionFolder raw={row.raw || {}} studentEmail={row.email} />
            </div>
          )}

          {tab === "documents" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <a href="https://gamma.app/docs/PPBMS-Student-Progress-Dashboard-whsfuidye58swk3?mode=doc" target="_blank" rel="noreferrer" className="text-purple-600">PPBMS Student Progress Dashboard (Doc)</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
