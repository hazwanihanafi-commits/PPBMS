// frontend/pages/supervisor/[email].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
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
        const r = await fetch(`${API}/api/supervisor/student/${encodeURIComponent(email)}`, { headers: { Authorization: `Bearer ${token}` } });
        const txt = await r.text();
        if (!r.ok) throw new Error(txt);
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

  // Build timeline rows from student's raw using expected/actual/status
  const raw = student.raw || {};
  // Expected keys come from calcProgress items; to keep generic we map the keys from raw using the plan items
  const rows = Object.keys(raw)
    // filter only keys that match "Expected/Actual" pattern or known milestone labels — keep it small and safe
    .filter(k => k.endsWith("Expected") || k.endsWith("Actual") || k.includes("Development Plan") || k.includes("Thesis Draft") || k.includes("Annual Progress"))
    .map(k => ({ activity: k, expected: raw[k + " Expected"] || "", actual: raw[k + " Actual"] || raw[k] || "" }));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="rounded-xl bg-white p-6 shadow space-y-3">
        <h2 className="text-2xl font-semibold">{student.name}</h2>
        <p className="text-sm text-gray-600">{student.programme}</p>
        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
          <div><strong>Email:</strong> {student.email}</div>
          <div><strong>Supervisor:</strong> {student.supervisor}</div>
          <div><strong>Field:</strong> {raw.Field || "—"}</div>
          <div><strong>Department:</strong> {raw.Department || "—"}</div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-3">Expected vs Actual</h3>
        <TimelineTable rows={rows} />
      </div>
    </div>
  );
}
