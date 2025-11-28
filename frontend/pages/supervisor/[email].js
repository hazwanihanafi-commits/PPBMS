// frontend/pages/supervisor/[email].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function SupervisorStudentDetail() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!email) return;
    const token = localStorage.getItem("ppbms_token");
    if (!token) {
      setErr("Not logged in");
      setLoading(false);
      return;
    }

    fetch(`${API}/api/supervisor/student/${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setStudent(data.student || null);
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [email]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!student) return <div className="p-6">No student data.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{student.name}</h1>
      <div className="bg-white p-4 rounded shadow">
        <p><strong>Programme:</strong> {student.programme}</p>
        <p><strong>Supervisor:</strong> {student.supervisor}</p>
        <p><strong>Progress:</strong> {student.progress}%</p>
        <p><strong>Status:</strong> {student.status}</p>

        <h3 className="mt-4 font-semibold">Raw details</h3>
        <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(student.raw, null, 2)}</pre>
      </div>
    </div>
  );
}
