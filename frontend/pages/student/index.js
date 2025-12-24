import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import StudentChecklist from "../../components/StudentChecklist";

export default function StudentPage() {
  const [profile, setProfile] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const token = localStorage.getItem("ppbms_token");

    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load");
      } else {
        setProfile(data.row);
        setTimeline(data.row.timeline || []);
      }
    } catch {
      setError("Backend error");
    }

    setLoading(false);
  }

  async function markCompleted(activity) {
    const token = localStorage.getItem("ppbms_token");
    const date = new Date().toISOString().slice(0, 10);

    await fetch(`${API_BASE}/api/student/update-actual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ activity, date }),
    });

    load();
  }

  async function resetCompleted(activity) {
    const token = localStorage.getItem("ppbms_token");

    await fetch(`${API_BASE}/api/student/reset-actual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ activity }),
    });

    load();
  }

  if (loading) return <div className="p-6">Loading student data…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!profile) return null;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">🎓 Student Dashboard</h1>

      <div className="mb-6 bg-white p-4 rounded shadow">
        <p><strong>Name:</strong> {profile.student_name}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Programme:</strong> {profile.programme}</p>
      </div>

      <StudentChecklist />

      <div className="mt-8 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Timeline</h2>

        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Activity</th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {timeline.map((t, i) => (
              <tr key={i} className="border-t">
                <td>{t.activity}</td>
                <td>{t.expected || "-"}</td>
                <td>{t.actual || "-"}</td>
                <td>
                  <button
                    onClick={() =>
                      t.actual
                        ? resetCompleted(t.activity)
                        : markCompleted(t.activity)
                    }
                    className={`px-3 py-1 rounded text-white ${
                      t.actual ? "bg-gray-500" : "bg-purple-600"
                    }`}
                  >
                    {t.actual ? "Reset" : "Mark Completed"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
