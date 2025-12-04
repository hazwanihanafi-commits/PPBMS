import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

export default function SupervisorDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/supervisor/students`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("ppbms_token")}` },
      });

      const json = await res.json();
      if (!res.ok) return setErr(json.error || "Unable to load students");
      setStudents(json.students || []);
    } catch (e) {
      console.error(e);
      setErr("Unable to fetch data.");
    }
    setLoading(false);
  }

  if (loading) return <div className="p-6 text-gray-600">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      
      <h1 className="text-3xl font-bold mb-6">Supervisor Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {students.map((s, idx) => (
          <div
            key={idx}
            className="p-6 bg-white rounded-2xl shadow-card border border-gray-100 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-1">{s.name}</h2>
            <p className="text-gray-600 mb-3">{s.email}</p>

            <p className="text-sm text-gray-700"><strong>Programme:</strong> {s.programme}</p>
            <p className="text-sm text-gray-700"><strong>Start Date:</strong> {s.start_date}</p>
            <p className="text-sm text-gray-700"><strong>Field:</strong> {s.field}</p>

            {/* PROGRESS BAR */}
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-semibold text-purple-700">{s.progressPercent}%</span>
              </div>

              <div className="w-full bg-gray-200 h-3 rounded-full">
                <div
                  className="bg-purple-600 h-3 rounded-full"
                  style={{ width: `${s.progressPercent}%` }}
                />
              </div>
            </div>

            <button
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl w-full font-semibold hover:bg-purple-700 transition"
              onClick={() =>
                router.push(`/supervisor/student/${encodeURIComponent(s.email)}`)
              }
            >
              View Full Progress →
            </button>
          </div>
        ))}

      </div>
    </div>
  );
}
