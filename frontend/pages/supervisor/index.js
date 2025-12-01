// pages/supervisor/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function SupervisorDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem("ppbms_user_email");
    const token = localStorage.getItem("ppbms_token");

    if (!email || !token) return;

    fetch(`${process.env.NEXT_PUBLIC_API}/api/supervisor/students?email=${email}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setStudents(d.students || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">My Students</h1>

      <table className="w-full border rounded text-sm">
        <thead className="bg-purple-600 text-white">
          <tr>
            <th className="p-2">Student</th>
            <th className="p-2">Programme</th>
            <th className="p-2">Progress</th>
            <th className="p-2"></th>
          </tr>
        </thead>

        <tbody>
          {students.map((s) => (
            <tr key={s.email} className="border-b">
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.programme}</td>
              <td className="p-2">{s.progress}%</td>
              <td className="p-2">
                <button
                  className="text-purple-600 underline"
                  onClick={() => router.push(`/supervisor/${s.email}`)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}

          {!students.length && (
            <tr>
              <td colSpan="4" className="text-center p-4 text-gray-500">
                No students found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
