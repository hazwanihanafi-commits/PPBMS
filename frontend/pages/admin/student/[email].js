import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { API_BASE } from "../../../utils/api";

export default function AdminStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (email) loadStudent();
  }, [email]);

  async function loadStudent() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/student/${email}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) setError(data.error || "Failed to load student");
      else setStudent(data.row);
    } catch {
      setError("Unable to load student data");
    }

    setLoading(false);
  }

  if (loading)
    return <div className="p-6 text-gray-600">Loading…</div>;

  if (error)
    return <div className="p-6 text-red-600">{error}</div>;

  if (!student)
    return <div className="p-6">No student data found.</div>;

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <button
        className="text-purple-700 hover:underline mb-6"
        onClick={() => router.push("/admin")}
      >
        ← Back to Admin Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-6">
        {student.student_name}
      </h1>

      {/* ================= PROFILE ================= */}
      <div className="bg-white p-6 rounded-2xl shadow mb-10">
        <p><strong>Email:</strong> {student.email}</p>
        <p><strong>Programme:</strong> {student.programme}</p>
        <p><strong>Department:</strong> {student.department}</p>
      </div>

      {/* ================= DOCUMENTS ================= */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-4">📄 Documents</h2>

        <ul className="space-y-3">
          {Object.entries(student.documents).map(([label, url]) => (
            <li
              key={label}
              className="flex justify-between border-b pb-2"
            >
              <span>{label}</span>

              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-700 underline"
                >
                  View
                </a>
              ) : (
                <span className="text-gray-400 text-sm">
                  Not submitted
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
