// pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import SubmissionFolder from "../../components/SubmissionFolder";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

const MSC_ITEMS = [
  "Development Plan & Learning Contract",
  "Proposal Defense Endorsed",
  "Pilot / Phase 1 Completed",
  "Phase 2 Data Collection Begun",
  "Annual Progress Review (Year 1)",
  "Phase 2 Data Collection Continued",
  "Seminar Completed",
  "Thesis Draft Completed",
  "Internal Evaluation Completed (Pre-Viva)",
  "Viva Voce",
  "Corrections Completed",
  "Final Thesis Submission"
];

const PHD_ITEMS = [
  "Development Plan & Learning Contract",
  "Proposal Defense Endorsed",
  "Pilot / Phase 1 Completed",
  "Annual Progress Review (Year 1)",
  "Phase 2 Completed",
  "Seminar Completed",
  "Data Analysis Completed",
  "1 Journal Paper Submitted",
  "Conference Presentation",
  "Annual Progress Review (Year 2)",
  "Thesis Draft Completed",
  "Internal Evaluation Completed (Pre-Viva)",
  "Viva Voce",
  "Corrections Completed",
  "Final Thesis Submission"
];

// helper: compute expected dates from startDate (simple offsets)
// NOTE: tweak offsets to your policy
function buildExpectedDates(startDateStr, isMsc) {
  if (!startDateStr) return {};
  const start = new Date(startDateStr);
  const map = {};
  // simple offsets (months) — adjust as you like
  const offsets = isMsc
    ? {
        "Development Plan & Learning Contract": 1,
        "Proposal Defense Endorsed": 9,
        "Pilot / Phase 1 Completed": 12,
        "Phase 2 Data Collection Begun": 12,
        "Annual Progress Review (Year 1)": 12,
        "Phase 2 Data Collection Continued": 18,
        "Seminar Completed": 18,
        "Thesis Draft Completed": 20,
        "Internal Evaluation Completed (Pre-Viva)": 22,
        "Viva Voce": 23,
        "Corrections Completed": 24,
        "Final Thesis Submission": 24
      }
    : {
        "Development Plan & Learning Contract": 1,
        "Proposal Defense Endorsed": 12,
        "Pilot / Phase 1 Completed": 12,
        "Annual Progress Review (Year 1)": 12,
        "Phase 2 Completed": 24,
        "Seminar Completed": 24,
        "Data Analysis Completed": 30,
        "1 Journal Paper Submitted": 30,
        "Conference Presentation": 30,
        "Annual Progress Review (Year 2)": 24,
        "Thesis Draft Completed": 34,
        "Internal Evaluation Completed (Pre-Viva)": 36,
        "Viva Voce": 37,
        "Corrections Completed": 38,
        "Final Thesis Submission": 38
      };

  Object.entries(offsets).forEach(([k, months]) => {
    const d = new Date(start);
    d.setMonth(d.getMonth() + months);
    map[k] = d.toISOString().slice(0, 10);
  });
  return map;
}

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("progress");
  const router = useRouter();

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
        setRow(data.row || null);
      } catch (err) {
        setError(err.message || "Failed to load");
      } finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!row) return null;

  const programmeText = (row.programme || "").toLowerCase();
  const isMsc = programmeText.includes("msc") || programmeText.includes("master");
  const items = isMsc ? MSC_ITEMS : PHD_ITEMS;
  const expectedMap = buildExpectedDates(row.start_date, isMsc);

  // compute progress: count approved items
  const approvedCount = items.filter((item) => {
    // sheet columns named like `${item}` and `${item} SupervisorApproved`
    const approved = row[`${item} SupervisorApproved`] || row[`${item} SupervisorApproved`] === "TRUE" || (row[`${item} SupervisorApproved`] === "true");
    // to be flexible, treat various truthy strings
    const a = (row[`${item} SupervisorApproved`] || "").toString().toLowerCase();
    return a === "true" || a === "approved" || a === "yes";
  }).length;

  const total = items.length;
  const percentage = Math.round((approvedCount / total) * 100);

  // helper to call toggle student date or upload
  async function setActualDate(item, dateStr) {
    try {
      setLoading(true);
      const studentEmail = row["Student's Email"] || row["Student Email"] || row.email;
      // call toggle endpoint (actor student) — backend will write date and clear supervisor approved
      const body = { studentEmail, key: item, actor: "student", date: dateStr };
      await fetch(`${API}/api/tasks/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      // refresh
      const r2 = await fetch(`${API}/api/student/me`, { headers: { Authorization: `Bearer ${token}` }});
      const t2 = await r2.text(); if (!r2.ok) throw new Error(t2);
      const data2 = JSON.parse(t2); setRow(data2.row);
    } catch (e) {
      console.error(e);
      setError(e.message || "Update failed");
    } finally { setLoading(false); }
  }

  async function handleUpload(item, file) {
    if (!file) return;
    try {
      setLoading(true);
      const studentEmail = row["Student's Email"] || row["Student Email"] || row.email;
      const form = new FormData();
      form.append("file", file);
      form.append("studentEmail", studentEmail);
      form.append("key", item);
      const res = await fetch(`${API}/api/tasks/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      // refresh data
      const r2 = await fetch(`${API}/api/student/me`, { headers: { Authorization: `Bearer ${token}` }});
      const t2 = await r2.text(); if (!r2.ok) throw new Error(t2);
      const data2 = JSON.parse(t2); setRow(data2.row);
    } catch (e) {
      console.error(e);
      setError(e.message || "Upload failed");
    } finally { setLoading(false); }
  }

  // helper to export pdf:
  async function exportPdf() {
    try {
      const studentEmail = row["Student's Email"] || row["Student Email"] || row.email;
      const res = await fetch(`${API}/api/tasks/exportPdf/${encodeURIComponent(studentEmail)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(row["Student Name"] || "student")}_progress.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError("PDF export failed");
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
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="font-semibold text-lg">{row["Student Name"] || row.student_name}</div>
            <div className="text-sm text-gray-600 mt-2">
              <div><strong>Supervisor:</strong> {row["Main Supervisor"]}</div>
              <div><strong>Email:</strong> {row["Main Supervisor's Email"] || row["Main Supervisor Email"] || row.email}</div>
              <div><strong>Start Date:</strong> {row["Start Date"] || row.start_date}</div>
            </div>
            <div className="mt-4">
              <button className="px-4 py-2 bg-purple-600 text-white rounded" onClick={exportPdf}>Export PDF</button>
            </div>
          </div>
        </div>

        <div className="col-span-8 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow flex items-center gap-6">
            <div style={{width:150}}>
              <DonutChart percentage={percentage} size={120} />
            </div>
            <div>
              <div className="text-4xl font-bold">{percentage}%</div>
              <div className="text-gray-600">{approvedCount} of {total} items approved</div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Progress Checklist</h3>
            <div className="space-y-4">
              {items.map((item) => {
                const actualDate = row[`${item} Date`] || row[`${item} StudentTickDate`] || row[`${item}`] || "";
                const approved = (row[`${item} SupervisorApproved`] || "").toString().toLowerCase() === "true";
                const submissionUrl = row[`${item} Submission URL`] || row[`${item} SubmissionURL`] || "";
                const expected = expectedMap[item] || "—";
                // mandatory file items: P1 + annual + final/internal
                const mandatory = (
                  item === "Development Plan & Learning Contract" ||
                  item.startsWith("Annual Progress Review") ||
                  item === "Internal Evaluation Completed (Pre-Viva)" ||
                  item === "Final Thesis Submission"
                );

                return (
                  <div key={item} className="border-b py-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{item}</div>
                      <div className="text-sm text-gray-500">Expected: {expected} &nbsp; • &nbsp; Actual: {actualDate || "—"} &nbsp; • &nbsp; Status: {approved ? "Approved" : (actualDate ? "Pending approval" : "Pending")}</div>
                      {submissionUrl ? <div className="text-sm"><a href={submissionUrl} target="_blank" rel="noreferrer" className="text-purple-600">View file</a></div> : null}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* date input */}
                      <input
                        type="date"
                        className="border p-2 rounded text-sm"
                        defaultValue={actualDate ? actualDate.slice(0,10) : ""}
                        onBlur={(e) => { if (e.target.value) setActualDate(item, e.target.value); }}
                      />
                      {/* upload only show for mandatory items */}
                      {mandatory && (
                        <label className="bg-gray-100 border rounded px-2 py-1 text-sm cursor-pointer">
                          Choose file
                          <input
                            type="file"
                            className="hidden"
                            onChange={(ev) => {
                              const f = ev.target.files && ev.target.files[0];
                              if (f) handleUpload(item, f);
                            }}
                          />
                        </label>
                      )}
                      {/* simple approve badge */}
                      <div className={`px-2 py-1 rounded text-xs ${approved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {approved ? "Approved" : "Awaiting approval"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Expected vs Actual</h3>
            <TimelineTable
              rows={items.map((item) => ({
                activity: item,
                expected: expectedMap[item] || "—",
                actual: row[`${item} Date`] || row[`${item} StudentTickDate`] || row[`${item}`] || "—",
                status: ((row[`${item} SupervisorApproved`] || "").toString().toLowerCase() === "true") ? "Approved" : ((row[`${item} Date`] || row[`${item}`]) ? "Pending" : "No target"),
                remaining: (() => {
                  const exp = expectedMap[item];
                  const act = row[`${item} Date`] || row[`${item} StudentTickDate`] || row[`${item}`];
                  if (!exp) return "—";
                  if (act) return "—";
                  const daysLeft = Math.ceil((new Date(exp) - new Date()) / (1000*60*60*24));
                  if (daysLeft < 0) return `Overdue ${Math.abs(daysLeft)}d`;
                  return `${daysLeft}d`;
                })()
              }))}
            />
          </div>

          <div className="rounded-xl bg-white p-6 shadow text-right">
            <button className="px-4 py-2 bg-purple-600 text-white rounded" onClick={exportPdf}>Download progress PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}
