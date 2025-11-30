// frontend/pages/supervisor/[email].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MilestoneGantt from "../../components/MilestoneGantt";
import TimelineTable from "../../components/TimelineTable";
import { calculateProgress } from "../../utils/calcProgress";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SupervisorStudentDetail() {
  const router = useRouter();
  const { email } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!email) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("ppbms_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const r = await fetch(`${API}/api/supervisor/student/${encodeURIComponent(email)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const txt = await r.text();
        if (!r.ok) throw new Error(txt);
        const data = JSON.parse(txt);
        setStudent(data.student || data);
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to fetch student");
      } finally {
        setLoading(false);
      }
    })();
  }, [email]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!student) return <div className="p-6">Student not found.</div>;

  const raw = student.raw || student;
  const prog = calculateProgress(raw, student.programme || "");
  const activityRows = prog.items.map((it) => ({
    activity: it.label,
    milestone: it.label,
    expected: "", // optional mapping
    actual: raw[it.key] || (it.done ? raw[`${it.key} Date`] || "" : ""),
  }));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="rounded-xl bg-white p-6 shadow space-y-3">
        <h2 className="text-2xl font-semibold">{student.name}</h2>
        <p className="text-sm text-gray-600">{student.programme}</p>
        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
          <div>
            <strong>Email:</strong> {student.email}
          </div>
          <div>
            <strong>Supervisor:</strong> {student.supervisor || raw["Main Supervisor"]}
          </div>
          <div>
            <strong>Field:</strong> {raw.Field || "—"}
          </div>
          <div>
            <strong>Department:</strong> {raw.Department || "—"}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-3">Submission Status</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>Development Plan (P1):</strong> {raw["Development Plan & Learning Contract"] || raw["P1 Submitted"] || "Not submitted"}
          </li>
          <li>
            <strong>Annual Progress Review (P5):</strong> {raw["Annual Progress Review (Year 1)"] || raw["P5 Submitted"] || "Not submitted"}
          </li>
          <li>
            <strong>Other required documents:</strong> check the Submission Folder or sheet.
          </li>
        </ul>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-3">Milestone Gantt (preview)</h3>
        <MilestoneGantt rows={activityRows} />
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-3">Expected vs Actual</h3>
        <TimelineTable rows={activityRows} />
      </div>
    </div>
  );
}
