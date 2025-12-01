// frontend/pages/supervisor/[email].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import TimelineTable from "../../components/TimelineTable";
import MilestoneGantt from "../../components/MilestoneGantt"; // optional
import { calculateProgress } from "../../utils/calcProgress";

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
  if (!student) return <div className="p-6 text-red-600">Student not found</div>;

  const prog = calculateProgress(student.raw || {}, student.programme || "");
  const activityRows = prog.items.map(it => ({
    activity: it.label,
    expected: "", // supervisor page can show expected based on start date if needed
    actual: it.actual || "",
    status: it.isDone ? "Completed" : "Pending",
    remaining: it.isDone ? "-" : ""
  }));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-2xl font-semibold">{student.name}</h2>
        <div className="text-sm text-gray-600">{student.programme}</div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold mb-3">Activity Checklist</h3>
        <TimelineTable rows={activityRows} />
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold mb-3">Submissions (mandatory files)</h3>
        <ul className="text-sm">
          <li>Development Plan: {student.raw?.["Development Plan & Learning Contract - FileURL"] ? <a href={student.raw["Development Plan & Learning Contract - FileURL"]} target="_blank" rel="noreferrer">View</a> : "Not uploaded"}</li>
          <li>Annual Review: {student.raw?.["Annual Progress Review (Year 1) - FileURL"] ? <a href={student.raw["Annual Progress Review (Year 1) - FileURL"]} target="_blank" rel="noreferrer">View</a> : "Not uploaded"}</li>
        </ul>
      </div>
    </div>
  );
}
