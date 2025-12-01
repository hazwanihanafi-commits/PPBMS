// frontend/pages/supervisor/[email].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SubmissionFolder from "../../components/SubmissionFolder";
import MilestoneGantt from "../../components/MilestoneGantt";
import TimelineTable from "../../components/TimelineTable";
import { calculateProgress } from "../../utils/calcProgress";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SupervisorStudentDetail() {
  const router = useRouter();
  const { email } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchStudent() {
    if (!email) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("ppbms_token");
      const r = await fetch(`${API}/api/supervisor/student/${encodeURIComponent(email)}`, { headers: { Authorization: `Bearer ${token}` }});
      const txt = await r.text();
      if (!r.ok) throw new Error(txt);
      const data = JSON.parse(txt);
      setStudent(data.student || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStudent(); }, [email]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6 text-red-600">Student not found.</div>;

  const prog = calculateProgress(student.raw || {}, student.programme || "");
  const activityRows = prog.items.map(it => ({
    activity: it.label,
    expected: "",
    actual: student.raw?.[it.key] || "",
    status: it.done ? "Completed" : "Pending",
    remaining: it.done ? "" : "—"
  }));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-2xl font-semibold">{student.name}</h2>
        <div className="text-sm text-gray-600">{student.programme}</div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div><strong>Email:</strong> {student.email}</div>
          <div><strong>Supervisor:</strong> {student.supervisor}</div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-3">Submission Status</h3>
        <ul className="space-y-2 text-sm">
          <li><strong>Progress:</strong> {prog.percentage}% — {prog.doneCount} of {prog.total}</li>
        </ul>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-3">Submission Folder (Supervisor)</h3>
        <SubmissionFolder raw={student.raw || {}} studentEmail={student.email} isSupervisor={true} onUpdated={fetchStudent} />
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-3">Expected vs Actual</h3>
        <TimelineTable rows={activityRows} />
      </div>
    </div>
  );
}
