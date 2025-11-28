import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function SupervisorStudentDetail() {
  const router = useRouter();
  const { id } = router.query; // student email as ID

  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem("ppbms_token");
    if (!token) {
      setError("Not logged in");
      return;
    }

    fetch(`${API}/api/supervisor/student/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const txt = await res.text();
        if (!res.ok) throw new Error(txt);
        return JSON.parse(txt);
      })
      .then((data) => {
        setRow(data.row || null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!row) return <div className="p-6">No student data found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-purple-700">Student Profile</h1>

      <div className="rounded-xl bg-white p-6 shadow space-y-3">
        <h2 className="text-xl font-semibold">{row.student_name}</h2>
        <p><strong>Programme:</strong> {row.programme}</p>
        <p><strong>Email:</strong> {row.email}</p>
        <p><strong>Supervisor:</strong> {row.supervisor}</p>
        <p><strong>Department:</strong> {row.department}</p>
        <p><strong>Field:</strong> {row.field}</p>
        <p><strong>Status:</strong> {row.raw["Status P"]}</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-3">
          Submission Status
        </h3>

        <ul className="space-y-2 text-sm">
          <li><strong>P1:</strong> {row.raw["P1 Submitted"] || "Not Submitted"}</li>
          <li><strong>P3:</strong> {row.raw["P3 Submitted"] || "Not Submitted"}</li>
          <li><strong>P4:</strong> {row.raw["P4 Submitted"] || "Not Submitted"}</li>
          <li><strong>P5:</strong> {row.raw["P5 Submitted"] || "Not Submitted"}</li>
        </ul>
      </div>
    </div>
  );
}
