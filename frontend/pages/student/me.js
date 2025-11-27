// pages/student/me.js
import { useEffect, useState } from "react";
import TopNavbar from "../../components/TopNavbar";
import GradientCard from "../../components/GradientCard";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import ActivityMapping from "../../components/ActivityMapping";
import RemainingDaysWidget from "../../components/RemainingDaysWidget";

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

  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      setError("Not logged in");
      setLoading(false);
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
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        Loading…
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        Error: {error}
      </div>
    );
  if (!row) return null;

  const completed = [
    row.raw?.["P1 Submitted"],
    row.raw?.["P3 Submitted"],
    row.raw?.["P4 Submitted"],
    row.raw?.["P5 Submitted"],
  ].filter(Boolean).length;
  const percentage = Math.round((completed / 4) * 100);

  const milestones = [
    { key: "P1 Submitted", label: "P1" },
    { key: "P3 Submitted", label: "P3" },
    { key: "P4 Submitted", label: "P4" },
    { key: "P5 Submitted", label: "P5" },
  ].map((m) => ({
    label: m.label,
    expected: DUE[m.key] || null,
    actual: row.raw?.[m.key] || null,
    supervisor: row.main_supervisor || row.supervisor || "—",
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <header className="mb-6">
          <h1 className="text-4xl font-extrabold text-slate-900">PPBMS Student Progress</h1>
          <p className="mt-2 text-slate-700">{row.student_name} — {row.programme}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column (profile + summary) */}
          <div className="space-y-6 lg:col-span-1">
            <GradientCard>
              <h2 className="text-2xl font-bold text-purple-700 mb-2">Profile</h2>
              <div className="text-lg font-semibold">{row.student_name}</div>
              <div className="text-sm text-gray-700">{row.programme}</div>
              <div className="mt-3 text-sm">
                <div><strong>Supervisor:</strong> {row.main_supervisor}</div>
                <div className="mt-1"><strong>Email:</strong> {row.student_email}</div>
                <div className="mt-2"><strong>Status:</strong> {row.raw?.["Status P"] || "—"}</div>
              </div>
            </GradientCard>

            <GradientCard>
              <h3 className="text-2xl font-bold text-purple-700">Summary</h3>
              <div className="mt-3">
                <div><strong>Milestones Completed:</strong> {completed} / 4</div>
                <div className="mt-2"><strong>Last Submission:</strong> {row.raw?.["P5 Submitted"] || row.raw?.["P4 Submitted"] || "—"}</div>
                <div className="mt-2"><strong>Overall Status:</strong> {row.raw?.["Status P"] || "—"}</div>
              </div>

              <div className="mt-6 flex items-center gap-6">
                <DonutChart percentage={percentage} size={140} />
                <div>
                  <div className="text-sm text-gray-600">Progress</div>
                  <div className="text-2xl font-semibold mt-2">{percentage}%</div>
                </div>
              </div>
            </GradientCard>
          </div>

          {/* Right column: timeline, mapping */}
          <div className="lg:col-span-2 space-y-6">
            <GradientCard>
              <h3 className="text-2xl font-bold text-purple-700 mb-4">Expected vs Actual Timeline</h3>
              <TimelineTable rows={milestones} />
            </GradientCard>

            <GradientCard>
              <h3 className="text-2xl font-bold text-purple-700 mb-4">Activity → Milestone mapping</h3>
              <ActivityMapping />
            </GradientCard>
          </div>
        </div>

        <RemainingDaysWidget milestones={milestones} />

      </main>
    </div>
  );
}
