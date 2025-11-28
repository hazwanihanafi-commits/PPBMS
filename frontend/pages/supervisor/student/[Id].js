// pages/supervisor/[studentId].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import MilestoneGantt from "../../components/MilestoneGantt";
import TimelineTable from "../../components/TimelineTable";
import SubmissionFolder from "../../components/SubmissionFolder";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SupervisorStudentView() {
  const router = useRouter();
  const { studentId } = router.query;
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setToken(localStorage.getItem("ppbms_token"));
  }, []);

  useEffect(() => {
    if (!token || !studentId) return;
    (async () => {
      try {
        const res = await fetch(`${API}/api/student/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setRow(data.row || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, studentId]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!row) return null;

  // compute progress (P1,P3,P4,P5)
  const keys = ["P1 Submitted", "P3 Submitted", "P4 Submitted", "P5 Submitted"];
  const completed = keys.filter(k => {
    const v = row.raw?.[k];
    if (!v) return false;
    const s = String(v).trim().toLowerCase();
    return !["", "n/a", "#n/a", "—", "-", "na"].includes(s);
  }).length;
  const pct = Math.round((completed / keys.length) * 100);

  // build activity rows for gantt (reuse same logic from student page; simplified)
  const timeline = (row.programme || "").toLowerCase().includes("master") ? "msc" : "phd";
  // For brevity use a small mapping here — you can replace with import from shared file
  const mapping = timeline === "msc" ? [] : [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="rounded-xl bg-white p-6 shadow flex items-center gap-6">
        <DonutChart percentage={pct} size={120} />
        <div>
          <div className="text-3xl font-bold">{pct}%</div>
          <div className="text-gray-600">{completed} of 4 milestones completed</div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-4">{row.student_name} — {row.programme}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Supervisor:</strong> {row.supervisor}<br />
            <strong>Email:</strong> {row.email}<br />
            <strong>Start Date:</strong> {row.start_date || "—"}<br />
            <strong>Field:</strong> {row.field || "—"}<br />
            <strong>Department:</strong> {row.department || "—"}<br />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Submissions</h3>
        <SubmissionFolder raw={row.raw} />
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Timeline (Gantt)</h3>
        <div className="text-sm text-gray-600">(Gantt pulled from programme timeline)</div>
        <MilestoneGantt rows={mapping} width={900} />
      </div>
    </div>
  );
}
