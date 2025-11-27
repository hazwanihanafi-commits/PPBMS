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
      // for demo show error; in real app redirect to /login
      setError("Not logged in (demo). Add ppbms_token to localStorage to test.");
      setLoading(false);
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
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (error) return <div className="min-h-screen p-8 text-red-600">Error: {error}</div>;
  if (!row) return null;

  // compute progress
  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(Boolean).length;
  const percentage = Math.round((completed / 4) * 100);

  // prepare timeline rows
  const milestones = [
    { key: "P1 Submitted", label: "P1" },
    { key: "P3 Submitted", label: "P3" },
    { key: "P4 Submitted", label: "P4" },
    { key: "P5 Submitted", label: "P5" },
  ].map((m) => ({
    label: m.label,
    expected: DUE[m.key] || null,
    actual: row.raw[m.key] || null,
  }));

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <div className="lg:flex lg:min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:block lg:w-72">
          <Sidebar />
        </aside>

        {/* Main */}
        <main className="flex-1 px-4 sm:px-6 lg:px-12 py-6">
          <div className="max-w-5xl mx-auto">

            {/* BIG GRADIENT HEADER BOX (option B) */}
            <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-orange-400 text-white shadow-lg mb-6">
              <h1 className="text-4xl font-extrabold">PPBMS Student Progress</h1>
              <div className="mt-2 text-sm opacity-90">{row.student_name} — {row.programme}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: profile & summary */}
              <div className="space-y-6 lg:col-span-1">
                <GradientCard>
                  <h2 className="text-2xl font-bold text-purple-800 mb-2">Profile</h2>
                  <div className="text-lg font-semibold">{row.student_name}</div>
                  <div className="mt-2 text-sm text-gray-700">{row.programme}</div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div><strong>Supervisor:</strong> {row.main_supervisor}</div>
                    <div><strong>Email:</strong> {row.student_email}</div>
                    <div><strong>Status:</strong> {row.raw["Status P"] || "—"}</div>
                  </div>
                </GradientCard>

                <GradientCard>
                  <h3 className="text-2xl font-bold text-purple-800">Summary</h3>
                  <div className="mt-3 text-sm text-gray-700">
                    <div><strong>Milestones Completed:</strong> {completed} / 4</div>
                    <div className="mt-2"><strong>Last Submission:</strong> {row.raw["P5 Submitted"] || row.raw["P4 Submitted"] || "—"}</div>
                    <div className="mt-2"><strong>Overall Status:</strong> {row.raw["Status P"] || "—"}</div>
                  </div>
                </GradientCard>
              </div>

              {/* Right: progress, timeline and mapping */}
              <div className="lg:col-span-2 space-y-6">
                <GradientCard>
                  <div className="flex items-center gap-6">
                    <div className="w-48">
                      <DonutChart percentage={percentage} size={160} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-purple-800">Progress</h3>
                      <p className="mt-2 text-sm text-gray-700">Overview of milestones completed</p>
                      <div className="mt-4 text-2xl font-semibold">{percentage}%</div>
                    </div>
                  </div>
                </GradientCard>

                <GradientCard>
                  <h3 className="text-2xl font-bold text-purple-800 mb-4">Expected vs Actual Timeline</h3>
                  <TimelineTable rows={milestones} supervisor={row.main_supervisor} />
                </GradientCard>

                <GradientCard>
                  <h3 className="text-2xl font-bold text-purple-800 mb-3">Activity → Milestone mapping</h3>
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
