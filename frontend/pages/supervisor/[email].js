import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

export default function SupervisorStudentDetails() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (email) fetchStudent();
  }, [email]);

  async function fetchStudent() {
    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${email}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");

      setStudent(json.row);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!student) return <div className="p-6">No student data</div>;

  return (
    <div className="p-6 bg-purple-50 min-h-screen">
      <button
        className="text-purple-700 underline mb-4"
        onClick={() => router.push("/supervisor")}
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">
        {String(student.student_name || "-")}
      </h1>

      <p><strong>Email:</strong> {String(student.email || "-")}</p>
      <p><strong>Programme:</strong> {String(student.programme || "-")}</p>
      <p><strong>Supervisor:</strong> {String(student.supervisor || "-")}</p>

      <div className="mt-6 bg-white rounded p-4">
        <h3 className="font-semibold mb-2">Status</h3>
        <p>Student record loaded successfully.</p>
      </div>
    </div>
  );
}
