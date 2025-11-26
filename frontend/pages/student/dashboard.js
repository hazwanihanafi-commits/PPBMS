import { useEffect, useState } from "react";
import CircularMilestoneChart from "../../components/CircularMilestoneChart";
import GanttTimeline from "../../components/GanttTimeline";
import ProfileCard from "../../components/ProfileCard";
import StatCard from "../../components/StatCard";

const API = process.env.NEXT_PUBLIC_API_BASE;

const DUE = {
  "P1 Submitted": "2024-08-31",
  "P3 Submitted": "2025-01-31",
  "P4 Submitted": "2025-02-15",
  "P5 Submitted": "2025-10-01",
};

export default function StudentDashboard() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------------- LOAD TOKEN ---------------- */
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) window.location.href = "/login";
    setToken(t);
  }, []);

  /* ---------------- FETCH STUDENT DATA -------- */
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const r = await fetch(`${API}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!r.ok) {
          throw new Error(await r.text());
        }

        const data = await r.json();
        setRow(data.row);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading)
    return <div className="p-8 text-center text-gray-600">Loading…</div>;

  if (error)
    return (
      <div className="p-8 text-center text-red-600">
        Failed: {error}
      </div>
    );

  if (!row) return null;

  /* ---------------- CALCULATE PROGRESS -------- */
  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(Boolean).length;

  const percentage = Math.round((completed / 4) * 100);

  /* ---------------- SEND EMAIL BUTTON -------- */
  const sendReminder = async () => {
    alert("Reminder sent! (frontend only demo)");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <header className="max-w-6xl mx-auto mb-6">
        <h1 className="text-3xl font-extrabold text-purple-700">
          Student Dashboard
        </h1>
        <p className="text-gray-600">{row.student_name} — {row.programme}</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT: Profile */}
        <div className="lg:col-span-1">
          <ProfileCard 
            name={row.student_name}
            programme={row.programme}
            supervisor={row.main_supervisor}
            email={row.student_email}
          />
        </div>

        {/* RIGHT: Stats + Gantt + Circular */}
        <div className="lg:col-span-3 space-y-6">

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Milestones Completed" value={`${completed} / 4`} />
            <StatCard title="Last Submission" value={
              row.raw["P5 Submitted"] || row.raw["P4 Submitted"] || "—"
            } />
            <StatCard title="Overall Status" value={row.raw["Status P"] || "—"} />
          </div>

          {/* CIRCULAR PROGRESS */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Milestone Progress</h2>
            <CircularMilestoneChart percentage={percentage} />
          </section>

          {/* GANTT TIMELINE */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Gantt Timeline</h2>
            <GanttTimeline raw={row.raw} due={DUE} />
          </section>

          {/* EMAIL REMINDER */}
          <div className="pt-4">
            <button
              onClick={sendReminder}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Send Reminder
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
