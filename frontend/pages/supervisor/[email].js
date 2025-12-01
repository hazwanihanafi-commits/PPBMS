// frontend/pages/supervisor/[email].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import SubmissionFolder from "../../../components/SubmissionFolder";
import { calculateProgressFromPlan } from "../../../utils/calcProgress";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SupervisorStudentDetail() {
  const router = useRouter();
  const { email } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;
    (async () => {
      try {
        const token = localStorage.getItem("ppbms_token");
        const r = await fetch(`${API}/api/supervisor/student/${encodeURIComponent(email)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const txt = await r.text();
        if (!r.ok) throw new Error(txt);
        const data = JSON.parse(txt);
        setStudent(data.student || data.row || null);
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    })();
  }, [email]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6 text-red-600">Student not found.</div>;

  const prog = calculateProgressFromPlan(student.raw || {}, student.programme || "");

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="text-2xl">{student.name}</h2>
        <p className="text-sm text-gray-600">{student.programme}</p>
      </div>

      <div className="rounded bg-white p-6 shadow">
        <h3 className="font-semibold">Submission & Approval</h3>
        <SubmissionFolder raw={student.raw || {}} studentEmail={student.id} />
      </div>

      <div className="rounded bg-white p-6 shadow">
        <h3 className="font-semibold">Progress</h3>
        <div>{prog.percentage}% — {prog.doneCount} of {prog.total}</div>
      </div>
    </div>
  );
}
