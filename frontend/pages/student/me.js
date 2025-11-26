// pages/student/me.js
import { useEffect, useMemo, useState } from "react";

/**
 * Student "Me" page — redesigned purple gradient header + donut + timeline table
 * No external icon libs used (pure SVG), safe for Render builds.
 *
 * Drop this file at: frontend/pages/student/me.js
 */

const API = process.env.NEXT_PUBLIC_API_BASE || ""; // set in env

// Activity -> Milestone (AMDI code) mapping
const ACTIVITY_MAP = {
  Registration: "P1",
  Literature: "P3",
  Proposal: "P3",
  Ethics: "P3",
  Pilot: "P4",
  Implementation: "P4",
  "Mid-Candidature": "P5",
  Seminar: "P5",
  Publication: "P4",
  Dissemination: "P4",
  Thesis: "P5",
  "Pre-Submission": "P5",
  Examination: "P5",
};

// Default milestone due dates (customize)
const DUE_MAP = {
  "P1 Submitted": "2024-08-31",
  "P3 Submitted": "2025-01-31",
  "P4 Submitted": "2025-02-15",
  "P5 Submitted": "2025-10-01",
};

function formatDateSafe(d) {
  if (!d) return "—";
  // If string like "P1" or null, return as-is
  if (typeof d === "string" && /^[A-Za-z]/.test(d) && isNaN(Date.parse(d))) {
    return d;
  }
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString();
}

/* ---------- Donut SVG component ---------- */
function Donut({ percentage = 0, size = 140, stroke = 14 }) {
  const radius = (size - stroke) / 2;
  const circumference = Math.PI * 2 * radius;
  const dash = (percentage / 100) * circumference;
  const gap = circumference - dash;

  return (
    <div className="inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="g1" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#D946EF" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feBlend in="SourceGraphic" in2="b" mode="normal" />
          </filter>
        </defs>

        {/* background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={stroke}
          fill="none"
        />
        {/* gradient progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#g1)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${gap}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* center label */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontWeight="700"
          fontSize={size * 0.18}
          fill="#0f172a"
        >
          {percentage}%
        </text>
      </svg>
    </div>
  );
}

/* ---------- Small Icon SVGs (no external libs) ---------- */
const IconCalendar = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5" />
    <path d="M16 2v4M8 2v4" strokeWidth="1.5" />
    <path d="M3 10h18" strokeWidth="1.5" />
  </svg>
);

export default function StudentMe() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState(null);

  // load token from localStorage
  useEffect(() => {
    const t = typeof window !== "undefined" && localStorage.getItem("ppbms_token");
    if (!t) {
      // if no token, redirect to login (same as previous behaviour)
      if (typeof window !== "undefined") window.location.href = "/login";
      return;
    }
    setToken(t);
  }, []);

  // fetch student /me
  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) {
          const txt = await r.text();
          throw new Error(txt || r.statusText || "Failed to fetch");
        }
        const data = await r.json();
        // Expect data.row.raw {...}
        setRow(data.row || data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // progress derived value
  const completedCount = useMemo(() => {
    if (!row) return 0;
    const vals = [
      row.raw?.["P1 Submitted"],
      row.raw?.["P3 Submitted"],
      row.raw?.["P4 Submitted"],
      row.raw?.["P5 Submitted"],
    ];
    return vals.filter(Boolean).length;
  }, [row]);

  const percentage = Math.round((completedCount / 4) * 100);

  // prepare timeline rows
  const timelineRows = useMemo(() => {
    const labels = ["P1 Submitted", "P3 Submitted", "P4 Submitted", "P5 Submitted"];
    return labels.map((label) => {
      const due = DUE_MAP[label] || null;
      const submittedRaw = row?.raw?.[label] ?? null;
      const submitted = submittedRaw || null; // could be date or 'P1' etc.
      // compute status
      let status = "Pending";
      if (submitted) {
        // try parse date
        const dueTime = due ? Date.parse(due) : null;
        const submittedTime = Date.parse(submitted) || null;
        if (isNaN(submittedTime)) {
          status = "Submitted";
        } else if (dueTime && submittedTime > dueTime) status = "Late";
        else status = "On Time";
      }
      return { label, due, submitted, status };
    });
  }, [row]);

  // Approve/reject handlers (mocked - update to your real endpoints)
  async function handleApprove(milestoneCode) {
    if (!token || !row) return;
    setActionBusy(true);
    try {
      const resp = await fetch(`${API}/api/student/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          matric: row.matric || row.student_id || row.student_no,
          milestone: milestoneCode,
          action: "approve",
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      // optimistic local update: mark approval field
      setRow((r) => {
        const copy = JSON.parse(JSON.stringify(r));
        copy.raw[`${milestoneCode} Approved`] = "Approved";
        return copy;
      });
    } catch (err) {
      console.error(err);
      alert("Approve failed: " + (err.message || err));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReject(milestoneCode) {
    if (!token || !row) return;
    if (!confirm("Reject this submission?")) return;
    setActionBusy(true);
    try {
      const resp = await fetch(`${API}/api/student/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          matric: row.matric || row.student_id || row.student_no,
          milestone: milestoneCode,
          action: "reject",
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      setRow((r) => {
        const copy = JSON.parse(JSON.stringify(r));
        copy.raw[`${milestoneCode} Approved`] = "Rejected";
        return copy;
      });
    } catch (err) {
      console.error(err);
      alert("Reject failed: " + (err.message || err));
    } finally {
      setActionBusy(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  if (!row) return null;

  // Simple status for top header (use Status P or compute)
  const currentStatus = row.raw?.["Status P"] || "—";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER — gradient with illustration */}
      <header className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8 md:py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">PPBMS Student Progress</h1>
              <p className="mt-1 text-sm md:text-base opacity-90">
                Postgraduate monitoring — {row.programme || "Programme"}
              </p>
            </div>

            {/* simple illustration block (rounded card) */}
            <div className="hidden md:flex items-center">
              <div className="w-36 h-24 rounded-xl bg-white/20 border border-white/20 shadow-md flex items-center justify-center">
                <div className="text-sm text-white font-semibold">Student Profile</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Top info row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 bg-white rounded-xl shadow p-5">
            <h2 className="text-xl font-bold text-slate-900">{row.student_name || "Student Name"}</h2>
            <p className="mt-1 text-sm text-slate-600">{row.programme || ""}</p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-slate-500">Supervisor</div>
                <div className="font-semibold text-slate-800">{row.main_supervisor || "—"}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-slate-500">Email</div>
                <div className="font-semibold text-slate-800">{row.student_email || "—"}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-slate-500">Status</div>
                <div className="font-semibold text-slate-800">{currentStatus}</div>
              </div>
            </div>
          </div>

          {/* donut card */}
          <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center justify-center">
            <div className="text-sm text-slate-500">Milestone Progress</div>
            <div className="mt-3">
              <Donut percentage={percentage} />
            </div>
            <div className="mt-3 text-sm text-slate-700 font-medium">{completedCount} / 4 milestones</div>
          </div>
        </div>

        {/* Summary + Timeline */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary card */}
          <div className="md:col-span-1 bg-white rounded-xl shadow p-5">
            <h3 className="text-lg font-bold text-purple-700 mb-3">Summary</h3>
            <div className="text-sm text-slate-600">
              <div className="mb-3">
                <div className="text-xs text-slate-500">Milestones Completed</div>
                <div className="font-semibold">{completedCount} / 4</div>
              </div>
              <div className="mb-3">
                <div className="text-xs text-slate-500">Last Submission</div>
                <div className="font-semibold">
                  {row.raw?.["P5 Submitted"] || row.raw?.["P4 Submitted"] || row.raw?.["P3 Submitted"] || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Overall Status</div>
                <div className="font-semibold">{currentStatus}</div>
              </div>
            </div>
          </div>

          {/* Expected vs Actual table */}
          <div className="md:col-span-2 bg-white rounded-xl shadow p-5">
            <h3 className="text-lg font-bold text-purple-700 mb-4">Expected vs Actual Timeline</h3>

            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left">
                <thead>
                  <tr className="text-sm text-slate-500">
                    <th className="px-3 py-2">Milestone</th>
                    <th className="px-3 py-2">Expected</th>
                    <th className="px-3 py-2">Actual</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Supervisor</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineRows.map((tr) => {
                    const code = tr.label.split(" ")[0]; // e.g., "P1"
                    // approval field name
                    const approvedKey = `${code} Approved`;
                    const approvedVal = row.raw?.[approvedKey] ?? null;
                    return (
                      <tr key={tr.label} className="border-t">
                        <td className="px-3 py-3 align-top font-medium">{tr.label.replace(" Submitted", "")}</td>
                        <td className="px-3 py-3 align-top">{formatDateSafe(tr.due)}</td>
                        <td className="px-3 py-3 align-top">{formatDateSafe(tr.submitted)}</td>
                        <td className="px-3 py-3 align-top">
                          <span
                            className={[
                              "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold",
                              tr.status === "Late" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-800",
                            ].join(" ")}
                          >
                            {tr.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top text-sm">{row.main_supervisor || "—"}</td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(code)}
                              disabled={actionBusy}
                              className="px-3 py-1 rounded-md bg-purple-600 text-white text-sm hover:bg-purple-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(code)}
                              disabled={actionBusy}
                              className="px-3 py-1 rounded-md bg-red-50 text-red-700 text-sm border border-red-100 hover:bg-red-100 disabled:opacity-50"
                            >
                              Reject
                            </button>
                            <div className="text-xs text-slate-500 ml-2">
                              {approvedVal ? <span className="font-medium">{approvedVal}</span> : "—"}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Activity mapping & quick reminder */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-lg font-bold text-purple-700 mb-3">Activity → Milestone mapping</h3>
            <div className="text-sm text-slate-700">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(ACTIVITY_MAP).map(([act, code]) => (
                  <li key={act} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <div>
                      <div className="text-sm font-medium">{act}</div>
                      <div className="text-xs text-slate-500">{code}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-lg font-bold text-purple-700 mb-3">Reminders</h3>
            <p className="text-sm text-slate-600 mb-3">Send reminder emails to supervisor or student for overdue milestones.</p>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!confirm("Send reminder to supervisor?")) return;
                  try {
                    const r = await fetch(`${API}/api/notify/reminder`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ matric: row.matric || row.student_id || row.student_no }),
                    });
                    if (!r.ok) throw new Error(await r.text());
                    alert("Reminder sent (backend must implement endpoint).");
                  } catch (err) {
                    console.error(err);
                    alert("Send reminder failed: " + (err.message || err));
                  }
                }}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Send Reminder
              </button>

              <button
                onClick={() => {
                  // quick reset local approval preview (dev)
                  if (!confirm("Reset local approval preview?")) return;
                  setRow((r) => {
                    const copy = JSON.parse(JSON.stringify(r));
                    delete copy.raw?.["P1 Approved"];
                    delete copy.raw?.["P3 Approved"];
                    delete copy.raw?.["P4 Approved"];
                    delete copy.raw?.["P5 Approved"];
                    return copy;
                  });
                }}
                className="px-3 py-2 rounded-md border text-slate-700"
              >
                Reset Preview
              </button>
            </div>
          </div>
        </div>

        <div className="py-10" />
      </main>
    </div>
  );
}
