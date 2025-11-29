// pages/supervisor/[email].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SubmissionFolder from "../../components/SubmissionFolder";
import { calculateProgressFrom12, ACTIVITIES_12 } from "../../utils/calcProgress";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function SupervisorStudentDetail() {
  const router = useRouter();
  const { email } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;
    const token = localStorage.getItem("ppbms_token");
    if (!token) { setLoading(false); return; }

    fetch(`${API}/api/supervisor/student/${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setStudent(data.student || null);
      })
      .catch(err => console.error(err))
      .finally(()=>setLoading(false));
  }, [email]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6 text-red-600">Student not found</div>;

  const prog = calculateProgressFrom12(student.raw || {});
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">{student.name}</h1>
        <p className="text-sm text-gray-600">{student.programme}</p>
        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
          <div><strong>Email:</strong> {student.email}</div>
          <div><strong>Supervisor:</strong> {student.supervisor_name || student.supervisor}</div>
          <div><strong>Progress:</strong> {prog.percentage}% ({prog.done}/{prog.total})</div>
          <div><strong>Status:</strong> {student.status}</div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-lg font-semibold mb-3">Submission Folder & Checklist</h3>
        <SubmissionFolder raw={student.raw} studentEmail={student.email} />
      </div>
    </div>
  );
}
