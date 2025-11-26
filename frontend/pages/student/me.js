// frontend/pages/student/me.js
import { useEffect, useState } from "react";
import ProfileCard from "../../components/ProfileCard.jsx";
import StatCard from "../../components/StatCard.jsx";
import CircularMilestoneChart from "../../components/CircularMilestoneChart.jsx";
import GanttTimeline from "../../components/GanttTimeline.jsx";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

const DUE_MAP = {
  "P1 Submitted": "2024-08-31",
  "P3 Submitted": "2025-01-31",
  "P4 Submitted": "2025-02-15",
  "P5 Submitted": "2025-10-01",
};

export default function StudentMe() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = typeof window !== "undefined" && localStorage.getItem("ppbms_token");
    if (!t) {
      // keep behaviour same as before
      if (typeof window !== "undefined") window.location.href = "/login";
      return;
    }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await fetch(`${API}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error(await r.text());
        const data = await r.json();
        setRow(data.row);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to fetch");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-8 text-center">Loading dashboard…</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!row) return null;

  const milestones = [
    "P1 Submitted",
    "P1 Approved",
    "P3 Submitted",
    "P3 Approved",
    "P4 Submitted",
    "P4 Approved",
    "P5 Submitted",
    "P5 Approved",
  ];

  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(Boolean).length;
  const percentage = Math.round((completed / 4) * 100);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-6xl mx-auto mb-6">
        <h1 className="text-4xl font-extrabold text-purple-700">Student Dashboard</h1>
        <p className="text-gray-600 mt-1">{row.student_name} — {row.programme}</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT */}
        <aside className="lg:col-span-1">
          <ProfileCard
            name={row.student_name}
            programme={row.programme}
            supervisor={row.main_supervisor}
            email={row.student_email}
          />
        </aside>

        {/* RIGHT */}
        <section className="lg:col-span-3 space-y-6">
          {/* Top stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Milestones Completed" value={`${completed} / 4`} color="green" />
            <StatCard title="Last Submission" value={row.raw["P5 Submitted"] || row.raw["P4 Submitted"] || "—"} color="purple" />
            <StatCard title="Overall Status" value={row.raw["Status P"] || "—"} color="blue" />
          </div>

          {/* Charts + timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 bg-white p-6 rounded-2xl shadow">
              <h3 className="text-lg font-semibold mb-3">Milestone Progress</h3>
              <CircularMilestoneChart percentage={percentage} />
              <div className="mt-4 text-sm text-gray-600">{percentage}% complete</div>
            </div>

            <div className="col-span-2 bg-white p-6 rounded-2xl shadow">
              <h3 className="text-lg font-semibold mb-3">Milestones & Actions</h3>
              <div className="space-y-3">
                {["P1 Submitted","P3 Submitted","P4 Submitted","P5 Submitted"].map((k) => {
                  const val = row.raw[k];
                  const due = DUE_MAP[k] || null;
                  const overdue = !val && due && (new Date() > new Date(due));
                  return (
                    <div key={k} className="flex items-center justify-between border-b py-2">
                      <div>
                        <div className="font-medium">{k.replace(" Submitted","")}</div>
                        <div className="text-sm text-gray-500">{val ? `Date: ${val}` : (due ? `Due: ${due}` : "No date")}</div>
                      </div>
                      <div className="text-right">
                        {val ? (
                          <span className="inline-flex items-center text-green-700 font-medium">
                            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            Completed
                          </span>
                        ) : overdue ? (
                          <span className="inline-flex items-center text-red-600 font-medium">Overdue</span>
                        ) : (
                          <span className="inline-flex items-center text-gray-600">Pending</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => alert("Reminder sent! (frontend demo)")}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Send Reminder
                </button>
                <div className="text-sm text-gray-500">Click to notify supervisor about late milestones</div>
              </div>
            </div>
          </div>

          {/* Full Gantt-like timeline */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="text-lg font-semibold mb-3">Gantt Timeline</h3>
            <GanttTimeline raw={row.raw} due={DUE_MAP} />
          </div>
        </section>
      </main>
    </div>
  );
}
