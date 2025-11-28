// pages/supervisor/[email].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MilestoneGantt from "../../components/MilestoneGantt"; // optional if present
import TimelineTable from "../../components/TimelineTable"; // optional
const API = process.env.NEXT_PUBLIC_API_BASE;

export default function SupervisorStudentDetail() {
  const router = useRouter();
  const { email } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;
    const token = localStorage.getItem("ppbms_token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API}/api/supervisor/student/${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const txt = await r.text();
        if (!r.ok) throw new Error(txt);
        return JSON.parse(txt);
      })
      .then((data) => {
        setStudent(data.student || null);
      })
      .catch((e) => {
        console.error("student fetch error", e);
      })
      .finally(() => setLoading(false));
  }, [email]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6 text-red-600">Student not found.</div>;

  // prepare milestones for optional gantt/timeline components
  const milestones = [
    { milestone: "P1", definition: "Development Plan & Learning Contract", expected: student.raw?.["P1 Due"] || "", actual: student.raw?.["P1 Submitted"] || "" },
    { milestone: "P3", definition: "Research Logbook", expected: student.raw?.["P3 Due"] || "", actual: student.raw?.["P3 Submitted"] || "" },
    { milestone: "P4", definition: "Monthly Portfolio", expected: student.raw?.["P4 Due"] || "", actual: student.raw?.["P4 Submitted"] || "" },
    { milestone: "P5", definition: "Annual Review", expected: student.raw?.["P5 Due"] || "", actual: student.raw?.["P5 Submitted"] || "" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">{student.name}</h1>
        <p className="text-sm text-gray-600">{student.programme}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div><strong>Email:</strong> {student.email}</div>
          <div><strong>Supervisor:</strong> {student.supervisor}</div>
          <div><strong>Field:</strong> {student.raw?.Field || "—"}</div>
          <div><strong>Department:</strong> {student.raw?.Department || "—"}</div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-lg font-semibold">Progress</h3>
        <div className="mt-2">
          <div className="text-3xl font-bold">{student.progress}%</div>
          <div className="text-sm text-gray-600">Status: <strong>{student.status}</strong></div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Milestones (expected vs actual)</h3>
        {/* if you have MilestoneGantt / TimelineTable components, render them; otherwise show simple table */}
        {typeof MilestoneGantt === "function" ? (
          <MilestoneGantt rows={milestones} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Milestone</th>
                <th className="p-2 text-left">Expected</th>
                <th className="p-2 text-left">Actual</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr key={m.milestone}><td className="p-2">{m.milestone} — {m.definition}</td><td className="p-2">{m.expected || "—"}</td><td className="p-2">{m.actual || "—"}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
