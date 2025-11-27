// pages/student/me.js
import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import GradientCard from "../../components/GradientCard";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import ActivityMapping from "../../components/ActivityMapping";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

const DUE = {
  "P1 Submitted": "2024-08-31",
  "P3 Submitted": "2025-01-31",
  "P4 Submitted": "2025-02-15",
  "P5 Submitted": "2025-10-01",
};

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // load token
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      // not logged in — show message (you can redirect to /login if required)
      setLoading(false);
      setError("Not logged in");
      return;
    }
    setToken(t);
  }, []);

  // fetch student
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
        setError(err.message || "Failed to load student");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading…</div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto text-red-600">Error: {error}</div>
      </div>
    );
  if (!row) return null;

  // compute progress
  const completed = [
    row.raw?.["P1 Submitted"],
    row.raw?.["P3 Submitted"],
    row.raw?.["P4 Submitted"],
    row.raw?.["P5 Submitted"],
  ].filter(Boolean).length;
  const percentage = Math.round((completed / 4) * 100);

  // build timeline rows
  const milestones = [
    { key: "P1 Submitted", label: "P1" },
    { key: "P3 Submitted", label: "P3" },
    { key: "P4 Submitted", label: "P4" },
    { key: "P5 Submitted", label: "P5" },
  ].map((m) => ({
    label: m.label,
    expected: DUE[m.key] || null,
    actual: row.raw?.[m.key] || null,
  }));

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <div className="lg:flex lg:min-h-screen">
        {/* Sidebar (desktop only) */}
        <aside className="hidden lg:block lg:w-72 bg-gradient-to-b from-purple-600 to-purple-400 p-6">
          <Sidebar />
        </aside>

        {/* Main */}
        <main className="flex-1 px-4 sm:px-6 lg:px-12 py-6">
          <div className="max-w-4xl mx-auto">

            {/* Gradient header */}
            <div className="rounded-lg p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg mb-6">
              <h1 className="text-3xl font-extrabold">PPBMS Student Progress</h1>
              <div className="mt-2 text-sm opacity-90">
                {row.student_name} — {row.programme}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: profile + summary */}
              <div className="lg:col-span-1 space-y-6">
                <GradientCard>
                  <h2 className="text-2xl font-bold text-purple-700 mb-2">Profile</h2>
                  <div className="text-lg font-semibold">{row.student_name}</div>
                  <div className="mt-2 text-sm text-gray-700">{row.programme}</div>
                  <div className="mt-3 text-sm text-gray-800">
                    <div><strong>Supervisor:</strong> {row.main_supervisor}</div>
                    <div className="mt-1"><strong>Email:</strong> {row.student_email}</div>
                    <div className="mt-2"><strong>Status:</strong> {row.raw?.["Status P"] || "—"}</div>
                  </div>
                </GradientCard>

                <GradientCard>
                  <h3 className="text-2xl font-bold text-purple-700">Summary</h3>
                  <div className="mt-3 text-sm text-gray-800 space-y-2">
                    <div><strong>Milestones Completed:</strong> {completed} / 4</div>
                    <div><strong>Last Submission:</strong> {row.raw?.["P5 Submitted"] || row.raw?.["P4 Submitted"] || "—"}</div>
                    <div><strong>Overall Status:</strong> {row.raw?.["Status P"] || "—"}</div>
                  </div>
                </GradientCard>
              </div>

              {/* Middle / right: donut, timeline, activity mapping */}
              <div className="lg:col-span-2 space-y-6">
                <GradientCard>
                  <div className="flex items-start gap-6">
                    <div className="w-44 flex-shrink-0">
                      <DonutChart percentage={percentage} size={160} />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-purple-700">Progress</h3>
                      <p className="mt-2 text-gray-700">Overview of milestones completed</p>
                      <div className="mt-4 text-2xl font-semibold">{percentage}%</div>
                    </div>
                  </div>
                </GradientCard>

                <GradientCard>
                  <h3 className="text-2xl font-bold text-purple-700 mb-3">Expected vs Actual Timeline</h3>
                  <TimelineTable rows={milestones} />
                </GradientCard>

                <GradientCard>
                  <h3 className="text-2xl font-bold text-purple-700 mb-3">Activity → Milestone mapping</h3>
                  <ActivityMapping />
                </GradientCard>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
