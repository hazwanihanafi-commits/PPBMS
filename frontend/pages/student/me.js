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
  const [toggling, setToggling] = useState(null);

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
        setError(err.message || String(err));
      } finally { setLoading(false); }
    })();
  }, [token]);

  async function toggleItem(key, value) {
    // value = true means student ticked (set date), false = untick
    if (!row || !row.email) return;
    setToggling(key);
    try {
      const res = await fetch(`${API}/api/tasks/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentEmail: row.email, key, value })
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(txt);
      const data = JSON.parse(txt);
      // update local row with returned row if provided, else refetch
      if (data.row) setRow(data.row);
      else {
        // refetch
        const r2 = await fetch(`${API}/api/student/me`, { headers: { Authorization: `Bearer ${token}` } });
        const t2 = await r2.text();
        if (r2.ok) setRow(JSON.parse(t2).row);
      }
    } catch (e) {
      console.error("toggle error", e);
      alert("Toggle failed: " + (e.message || e));
    } finally {
      setToggling(null);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!row) return null;

  const prog = calculateProgress(row.raw || {}, row.programme || "");
  const activityRows = prog.items.map(it => ({
    activity: it.label,
    milestone: it.label,
    definition: it.label,
    start: row.start_date || "",
    expected: "", // could map expected date if present in sheet
    actual: row.raw?.[it.key] || ""
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
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 text-white text-xl font-bold">
                {(row.student_name || "NA").split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-lg">{row.student_name}</div>
                <div className="text-gray-600 text-sm">{row.programme}</div>
              </div>
            </div>

            <div className="mt-4 text-sm space-y-1">
              <div><strong>Supervisor:</strong> {row.raw?.["Main Supervisor"] || row.raw?.["Main Supervisor's Name"] || "—"}</div>
              <div><strong>Email:</strong> {row.email}</div>
              <div><strong>Start Date:</strong> {row.start_date || "—"}</div>
              <div><strong>Field:</strong> {row.field || "—"}</div>
              <div><strong>Department:</strong> {row.department || "—"}</div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <div className="flex gap-3 border-b pb-2 text-sm font-medium text-gray-600">
              <button onClick={() => setTab("progress")} className={tab==="progress" ? "text-purple-700 font-bold" : ""}>Progress</button>
              <button onClick={() => setTab("submissions")} className={tab==="submissions" ? "text-purple-700 font-bold" : ""}>Submissions</button>
              <button onClick={() => setTab("documents")} className={tab==="documents" ? "text-purple-700 font-bold" : ""}>Documents</button>
            </div>
          </div>
        </div>

        <div className="col-span-8 space-y-6">
          {tab === "progress" && (
            <>
              <div className="rounded-xl bg-white p-6 shadow flex items-center gap-6">
                <DonutChart percentage={prog.percentage} size={150} />
                <div>
                  <div className="text-4xl font-bold">{prog.percentage}%</div>
                  <div className="text-gray-600">{prog.doneCount} of {prog.total} items completed (approved/ticked)</div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-xl font-semibold text-purple-700 mb-4">Milestone Gantt (preview)</h3>
                <MilestoneGantt rows={activityRows} width={980} />
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-xl font-semibold text-purple-700 mb-4">Expected vs Actual</h3>
                <TimelineTable rows={activityRows} />
              </div>
            </>
          )}

          {tab === "submissions" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <h3 className="text-xl font-semibold text-purple-700 mb-4">Submissions & Tick Items</h3>

              <div className="space-y-2">
                {prog.items.map(it => {
                  const done = Boolean(row.raw?.[it.key] && String(row.raw[it.key]).trim() !== "");
                  const dateValue = done ? row.raw[it.key] : "";
                  return (
                    <div key={it.key} className="flex items-center justify-between border-b py-3">
                      <div>
                        <div className="font-medium">{it.label}</div>
                        <div className="text-sm text-gray-500">{it.mandatory ? "Mandatory" : "Optional"}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-sm">{dateValue || "Not ticked"}</div>
                        <button
                          className="px-3 py-1 rounded bg-purple-600 text-white text-sm"
                          disabled={toggling === it.key}
                          onClick={() => toggleItem(it.key, !done)}
                        >
                          {done ? "Untick" : "Tick"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6">
                <SubmissionFolder raw={row.raw} studentEmail={row.email} />
              </div>
            </div>
          )}

          {tab === "documents" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <h3 className="text-xl font-semibold text-purple-700 mb-3">Documents</h3>
              <p className="text-sm text-gray-600">Upload P1 and Annual Progress Review (P5) via the submission widget below.</p>
              <SubmissionFolder raw={row.raw} studentEmail={row.email} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
