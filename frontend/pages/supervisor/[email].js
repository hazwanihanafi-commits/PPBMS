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
        const r = await fetch(`${API}/api/supervisor/student/${encodeURIComponent(email)}`, { headers: { Authorization: `Bearer ${token}` }});
        const txt = await r.text();
        if (!r.ok) throw new Error(txt);
        const data = JSON.parse(txt);
        setStudent(data.student || null);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [email]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6 text-red-600">Student not found.</div>;

  const raw = student.raw || {};
  // build simple activity rows for gantt using the sheet keys if present
  const keys = [
    "Development Plan & Learning Contract",
    "Master Research Timeline (Gantt)",
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

  const rows = keys.map(k => ({
    activity: k,
    milestone: k,
    definition: k,
    start: student.start_date || "",
    expected: raw[`${k} Expected`] || "",
    actual: raw[k] || raw[`${k} Date`] || ""
  }));

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold">{student.name}</h2>
        <div className="text-sm text-gray-600">{student.programme}</div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
          <div><strong>Email:</strong> {student.email}</div>
          <div><strong>Supervisor:</strong> {student.supervisor}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-3">Milestone Gantt</h3>
        <MilestoneGantt rows={rows} width={1000} />
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-3">Timeline</h3>
        <TimelineTable rows={rows} />
      </div>
    </div>
  );
}
