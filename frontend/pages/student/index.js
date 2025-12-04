// frontend/pages/student/index.js
import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";

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
    try {
      const res = await fetch(`${API_BASE}/api/student/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("ppbms_token")}` }
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProfile(data.row);
        setTimeline(data.row.timeline || []);
      }
    } catch (e) {
      setError("Unable to load");
      console.error(e);
    }
    setLoading(false);
  }

  async function markCompleted(activity) {
    const date = new Date().toISOString().slice(0, 10);
    try {
      const res = await fetch(`${API_BASE}/api/student/update-actual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`
        },
        body: JSON.stringify({ activity, date })
      });

      const data = await res.json();
      if (!res.ok) return alert("Failed: " + (data.error || JSON.stringify(data)));

      load();
    } catch (e) {
      alert("Failed to update");
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!profile) return <div className="p-4">No profile</div>;

  const progress = timeline.length
    ? Math.round(
        (timeline.filter((t) => t.status === "Completed").length /
          timeline.length) *
          100
      )
    : 0;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Student Progress</h1>

      <div className="bg-white p-4 shadow rounded mb-6">
        <div><strong>{profile.student_name}</strong></div>
        <div>{profile.email}</div>
        <div>Programme: {profile.programme}</div>
        <div>Supervisor: {profile.supervisor}</div>
        <div>Start Date: {profile.start_date}</div>
        <div>Field: {profile.field}</div>
        <div style={{ marginTop: 8 }}>Progress: {progress}%</div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold">Expected vs Actual</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Activity</th>
              <th className="p-2">Expected</th>
              <th className="p-2">Actual</th>
              <th className="p-2">Status</th>
              <th className="p-2">Remaining</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((t, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{t.activity}</td>
                <td className="p-2">{t.expected || "-"}</td>
                <td className="p-2">{t.actual || "-"}</td>
                <td className="p-2">{t.status}</td>
                <td className="p-2">{t.remaining_days}</td>
                <td className="p-2">
                  {!t.actual && (
                    <button
                      onClick={() => markCompleted(t.activity)}
                      className="px-3 py-1 bg-green-500 text-white rounded"
                    >
                      Mark Completed (today)
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
