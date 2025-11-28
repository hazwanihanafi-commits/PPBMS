import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function SupervisorStudentDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem("ppbms_token");

    fetch(`${API}/api/supervisor/student/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setRow(data.row))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!row) return <div className="p-6">No student data</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      <h1 className="text-3xl font-bold text-purple-700">
        {row["Student Name"]}
      </h1>

      <div className="bg-white p-6 rounded-xl shadow">
        <p><strong>Email:</strong> {row["Student's Email"]}</p>
        <p><strong>Programme:</strong> {row["Programme"]}</p>
        <p><strong>Field:</strong> {row["Field"]}</p>
        <p><strong>Department:</strong> {row["Department"]}</p>
        <p><strong>Start Date:</strong> {row["Start Date"]}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-3">Submission Status</h2>

        <ul className="space-y-2">
          <li>P1 — {row["P1 Submitted"] || "Not submitted"}</li>
          <li>P3 — {row["P3 Submitted"] || "Not submitted"}</li>
          <li>P4 — {row["P4 Submitted"] || "Not submitted"}</li>
          <li>P5 — {row["P5 Submitted"] || "Not submitted"}</li>
        </ul>
      </div>

    </div>
  );
}
