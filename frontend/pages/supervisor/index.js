import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function SupervisorDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");
    if (!token) return;

    fetch(`${API}/api/supervisor/students`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setStudents(data.students || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  // Compute progress %
  const calcProgress = r => {
    const keys = ["P1 Submitted", "P3 Submitted", "P4 Submitted", "P5 Submitted"];
    const completed = keys.filter(k => r.raw[k]).length;
    return Math.round((completed / 4) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      <h1 className="text-4xl font-bold text-purple-700">
        Supervisor Dashboard
      </h1>
      <p className="text-gray-600">
        Overview of all student progress.
      </p>

      {/* STATUS BOXES */}
      <div className="grid grid-cols-4 gap-4">

        {["Ahead", "On Track", "At Risk", "Behind"].map(label => (
          <div key={label} className="p-4 bg-white shadow rounded-xl">
            <div className="font-semibold">{label}</div>
            {/* Empty until accuracy implemented */}
            <div className="text-3xl font-bold">0</div>
          </div>
        ))}

      </div>

      {/* STUDENT TABLE */}
      <div className="rounded-xl bg-white shadow p-6">
        <h2 className="text-xl font-bold mb-4">Supervised Students</h2>

        <table className="w-full">
          <thead>
            <tr className="bg-purple-100">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Programme</th>
              <th className="p-2 text-left">Progress</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {students.map(s => (
              <tr
                key={s.email}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => window.location.href = `/supervisor/${s.email}`}
              >
                <td className="p-2">{s.student_name}</td>
                <td className="p-2">{s.programme}</td>
                <td className="p-2">{calcProgress(s)}%</td>
                <td className="p-2">{s.status || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}
