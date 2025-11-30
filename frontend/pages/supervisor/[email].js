// frontend/pages/supervisor/[email].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MilestoneGantt from "../../components/MilestoneGantt";
import TimelineTable from "../../components/TimelineTable";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SupervisorStudentDetail() {
  const router = useRouter();
  const { email } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;
    const token = localStorage.getItem("ppbms_token");
    if (!token) { setLoading(false); return; }

    (async () => {
      try {
        const res = await fetch(`${API}/api/supervisor/student/${encodeURIComponent(email)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const txt = await res.text();
        if (!res.ok) throw new Error(txt);
        const data = JSON.parse(txt);
        setStudent(data.student || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [email]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6 text-red-600">Student not found.</div>;

  const raw = student.raw || {};
  // Build milestone rows for display
  const keys = [
    "Development Plan & Learning Contract",
    "Master Research Timeline (Gantt)",
    "Research Logbook (Weekly)",
    "Proposal Defense Endorsed",
    "Pilot / Phase 1 Completed",
    "Phase 2 Data Collection Begun",
    "Annual Progress Review (Year 1)",
    "Phase 2 Data Collection Continued",
    "Seminar Completed",
    "Thesis Draft Completed",
    "Internal Evaluation Completed",
    "Viva Voce",
    "Corrections Completed",
    "Final Thesis Submission"
  ];

  const milestones = keys.map(k => ({
    milestone: k,
    expected: "",
    actual: raw[k] || ""
  }));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-2xl font-semibold">{student.name}</h2>
        <p className="text-sm text-gray-600">{student.programme}</p>

        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
          <div><strong>Email:</strong> {student.email}</div>
          <div><strong>Supervisor:</strong> {student.supervisor}</div>
          <div><strong>Field:</strong> {raw.Field || "—"}</div>
          <div><strong>Department:</strong> {raw.Department || "—"}</div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-3">Submission Status</h3>
        <ul className="space-y-2 text-sm">
          <li><strong>Development Plan (P1):</strong> {raw["Development Plan & Learning Contract"] || "Not ticked"}</li>
          <li><strong>Annual Review (P5):</strong> {raw["Annual Progress Review (Year 1)"] || "Not ticked"}</li>
          <li><strong>Other ticks:</strong> See table below</li>
        </ul>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-3">Milestone Gantt (preview)</h3>
        <MilestoneGantt rows={milestones} />
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-3">Expected vs Actual</h3>
        <TimelineTable rows={milestones} />
      </div>
    </div>
  );
}
