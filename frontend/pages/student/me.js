// pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import SubmissionFolder from "../../components/SubmissionFolder";
import { calculateProgressFromPlan, MSC_PLAN, PHD_PLAN, expectedDatesFromStart } from "../../utils/calcProgress";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
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
        const res = await fetch(`${API}/api/student/me`, { headers: { Authorization: `Bearer ${token}` }});
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setRow(data.row || data); // adapt if API returns { row: ... }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!row) return <div className="p-8">No data</div>;

  const programmeText = (row.programme || "").toLowerCase();
  const isMsc = programmeText.includes("msc") || programmeText.includes("master");
  const plan = isMsc ? MSC_PLAN : PHD_PLAN;

  // compute expected dates from start_date
  const expectedMap = expectedDatesFromStart(row.start_date || row["Start Date"] || null, isMsc);

  // compute progress using row raw data (sheet columns)
  const prog = calculateProgressFromPlan(row.raw || row, plan);

  // handlers
  async function handleTick(studentEmail, key) {
    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(`${API}/api/tasks/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentEmail, key, actor: "student" })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || j.message || "Toggle failed");
      // refetch row
      const r2 = await fetch(`${API}/api/student/me`, { headers: { Authorization: `Bearer ${token}` }});
      const d2 = await r2.json();
      setRow(d2.row || d2);
    } catch (e) {
      alert("Error: " + (e.message || e));
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Student Progress</h1>
        <p className="mt-2 text-lg"><strong>{row["Student Name"] || row.student_name}</strong> — {row.programme}</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow space-y-4">
            <div>
              <div className="font-semibold text-lg">{row["Student Name"] || row.student_name}</div>
              <div className="text-gray-600 text-sm">{row.programme}</div>
            </div>
            <div className="text-sm space-y-1 mt-3">
              <div><strong>Supervisor:</strong> {row["Main Supervisor"] || row.supervisor || "—"}</div>
              <div><strong>Email:</strong> {row["Student's Email"] || row.email || "—"}</div>
              <div><strong>Start Date:</strong> {row["Start Date"] || row.start_date || "—"}</div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <DonutChart percentage={prog.percentage} size={160} />
            <div className="mt-2 text-center">{prog.percentage}% — {prog.done} of {prog.total} items approved</div>
            <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded" onClick={async ()=>{
              // export PDF
              const token = localStorage.getItem("ppbms_token");
              const url = `${API}/api/tasks/exportPdf/${encodeURIComponent(row["Student's Email"] || row.email)}`;
              const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
              if (!r.ok) return alert("Export failed");
              const blob = await r.blob();
              const u = URL.createObjectURL(blob);
              window.open(u, "_blank");
            }}>Export PDF</button>
          </div>
        </div>

        <div className="col-span-8 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Progress Checklist</h3>
            {plan.map((item) => {
              const actualVal = row[item.key] || row.raw?.[item.key] || (row[`${item.key} Submitted`] || row.raw?.[`${item.key} Submitted`]);
              const studentDate = row[`${item.key} StudentTickDate`] || row.raw?.[`${item.key} StudentTickDate`] || row[`${item.key} Student Date`];
              const approved = (row[`${item.key} SupervisorApproved`] || row.raw?.[`${item.key} SupervisorApproved`] || "").toString().toLowerCase() === "true";
              const expected = expectedMap[item.key] || "";
              const displayActual = studentDate || (actualVal ? String(actualVal) : "");
              return (
                <div key={item.key} className="border-b py-3 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-medium">{item.label}{item.mandatory ? " (mandatory)" : ""}</div>
                    <div className="text-sm text-gray-500">Expected: {expected || "—"} · Actual: {displayActual || "—"}</div>
                    <div className="text-sm mt-1">Status: {approved ? <span className="px-2 py-1 rounded bg-green-100 text-green-700">Approved</span> : item.mandatory && displayActual ? <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700">Awaiting approval</span> : <span className="px-2 py-1 rounded bg-gray-100">Pending</span>}</div>
                  </div>

                  <div className="flex-shrink-0 space-x-2">
                    {/* If item is mandatory show upload control */}
                    {(item.mandatory) && (
                      <SubmissionFolder
                        studentEmail={row["Student's Email"] || row.email}
                        keyName={item.key}
                        onUploaded={async ()=> {
                          // refresh
                          const t = localStorage.getItem("ppbms_token");
                          const r2 = await fetch(`${API}/api/student/me`, { headers: { Authorization: `Bearer ${t}` }});
                          const d2 = await r2.json();
                          setRow(d2.row || d2);
                        }}
                      />
                    )}

                    {/* allow student to mark done (saves tick + date to sheet) */}
                    {!displayActual && (
                      <button className="px-3 py-2 bg-purple-600 text-white rounded" onClick={() => handleTick(row["Student's Email"] || row.email, item.key)}>Mark done</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Expected vs Actual</h3>
            <TimelineTable rows={plan.map(it => ({
              activity: it.label,
              expected: expectedMap[it.key] || "—",
              actual: row[`${it.key} StudentTickDate`] || row.raw?.[`${it.key} StudentTickDate`] || "—",
              status: (row[`${it.key} SupervisorApproved`] || row.raw?.[`${it.key} SupervisorApproved`] || "").toString().toLowerCase() === "true" ? "Approved" : (row[`${it.key} StudentTickDate`] ? "Awaiting approval" : "Pending"),
              remaining: "—"
            }))} />
          </div>
        </div>
      </div>
    </div>
  );
}
