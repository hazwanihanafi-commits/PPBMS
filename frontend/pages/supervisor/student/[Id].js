import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SupervisorStudentDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`${API}/api/supervisor/student/${id}`);
        const data = await res.json();
        setRow(data.student || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-10 text-lg">Loading…</div>;
  if (!row) return <div className="p-10 text-lg text-red-600">Student not found</div>;

  const initials = row.student_name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      {/* BACK */}
      <Link
        href="/supervisor/dashboard"
        className="text-purple-600 font-semibold hover:underline"
      >
        ← Back
      </Link>

      {/* HEADER CARD */}
      <div className="bg-white p-6 rounded-xl shadow flex gap-6 items-center">
        <div className="w-20 h-20 rounded-xl bg-purple-600 text-white flex items-center justify-center text-3xl font-bold">
          {initials}
        </div>

        <div>
          <h1 className="text-3xl font-bold">{row.student_name}</h1>
          <p className="text-gray-600">{row.programme}</p>
        </div>
      </div>

      {/* INFO CARD */}
      <div className="bg-white rounded-xl shadow p-6 space-y-2 text-sm">
        <div>
          <strong>Email:</strong> {row.email}
        </div>
        <div>
          <strong>Supervisor:</strong> {row.supervisor}
        </div>
        <div>
          <strong>Start Date:</strong> {row.start_date}
        </div>
        <div>
          <strong>Field:</strong> {row.field}
        </div>
        <div>
          <strong>Department:</strong> {row.department}
        </div>
        <div>
          <strong>Status:</strong>{" "}
          <span className="text-purple-700 font-semibold">{row.status}</span>
        </div>
      </div>

      {/* MILESTONE TABLE */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-bold text-purple-700 mb-4">Milestones</h2>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-purple-600 text-white text-left">
              <th className="p-3">Milestone</th>
              <th className="p-3">Expected</th>
              <th className="p-3">Actual</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {row.milestones?.map((m, i) => (
              <tr key={i} className="border-b">
                <td className="p-3">{m.definition}</td>
                <td className="p-3">{m.expected}</td>
                <td className="p-3">{m.actual || "—"}</td>
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-lg ${
                      m.actual ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {m.actual ? "Submitted" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
