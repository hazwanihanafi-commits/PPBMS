// pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import MilestoneGantt from "../../components/MilestoneGantt";
import ActivityMapping from "../../components/ActivityMapping";
import SubmissionFolder from "../../components/SubmissionFolder";

const API = process.env.NEXT_PUBLIC_API_BASE;

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
        const r = await fetch(`${API}/api/student/me`, { headers: { Authorization: `Bearer ${token}` } });
        const text = await r.text();
        if (!r.ok) throw new Error(text);
        const data = JSON.parse(text);
        if (!data.row) throw new Error("No student record found");
        setRow(data.row);
      } catch (err) {
        setError(err.message.replace(/["{}]/g, ""));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!row) return null;

  const completed = [
    row?.raw?.["P1 Submitted"],
    row?.raw?.["P3 Submitted"],
    row?.raw?.["P4 Submitted"],
    row?.raw?.["P5 Submitted"],
  ].filter(x => x && x.trim() !== "").length;

  const percentage = Math.round((completed / 4) * 100);

  const milestones = [
    { key: "P1 Submitted", milestone: "P1" },
    { key: "P3 Submitted", milestone: "P3" },
    { key: "P4 Submitted", milestone: "P4" },
    { key: "P5 Submitted", milestone: "P5" },
  ].map(m => ({
    milestone: m.milestone,
    expected: DUE[m.key] || "—",
    actual: row?.raw?.[m.key] || "",
    start: row?.start_date || "",
    definition: `${m.milestone} — ${DUE[m.key] || "—"}`,
  }));

  const initials = (row.student_name || "NA").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="grid grid-cols-12 gap-6">
        {/* Left column */}
        <div className="col-span-4 space-y-6">
          <div className="rounded-xl p-6 bg-gradient-to-r from-[#7c3aed] to-[#fb923c] text-white shadow-lg">
            <h1 className="text-3xl font-bold">Student Progress</h1>
            <div className="mt-3 text-sm opacity-90">
              <strong className="block text-white">{row.student_name}</strong>
              <span className="block">{row.programme}</span>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#7c3aed] to-[#ec4899] text-white font-bold">
                {initials}
              </div>
              <div>
                <div className="font-semibold">{row.student_name}</div>
                <div className="text-sm text-gray-500">{row.programme}</div>
              </div>
            </div>

            <div className="mt-4 text-sm space-y-1">
              <div><strong>Supervisor:</strong> {row.supervisor || "—"}</div>
              <div><strong>Email:</strong> {row.email || "—"}</div>
              <div><strong>Start Date:</strong> {row.start_date || "—"}</div>
              <div><strong>Field:</strong> {row.field || "—"}</div>
              <div><strong>Department:</strong> {row.department || "—"}</div>
              <div><strong>Status:</strong> {row.status || "—"}</div>
            </div>
          </div>

          <SubmissionFolder raw={row.raw} />

          <div className="rounded-xl bg-white p-4 shadow">
            <h4 className="font-semibold mb-2">Resources</h4>
            <ul className="text-sm space-y-2">
              <li>
                <a className="text-purple-600 hover:underline" target="_blank" rel="noreferrer"
                   href="https://gamma.app/docs/PPBMS-Student-Progress-Dashboard-whsfuidye58swk3?mode=doc">
                  PPBMS Student Progress Dashboard (Doc)
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Right column */}
        <div className="col-span-8 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow flex items-center gap-6">
            <div style={{width:150}}>
              <DonutChart percentage={percentage} size={140} />
            </div>
            <div>
              <div className="text-3xl font-semibold">{percentage}%</div>
              <div className="text-gray-600 mt-1">{completed} of 4 milestones completed</div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Milestone Gantt Chart</h3>
            <MilestoneGantt rows={milestones} width={1000} />
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Expected vs Actual Timeline</h3>
            <TimelineTable rows={milestones} />
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Activity → Milestone Mapping</h3>
            <ActivityMapping />
          </div>

        </div>
      </div>
    </div>
  );
}
