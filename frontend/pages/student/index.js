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
        headers: { Authorization: `Bearer ${localStorage.getItem("ppbms_token")}` },
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProfile(data.row);
        setTimeline(data.row.timeline || []);
      }
    } catch (e) {
      setError("Unable to load student data.");
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
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
        body: JSON.stringify({ activity, date }),
      });

      const data = await res.json();
      if (!res.ok) return alert("Failed: " + (data.error || JSON.stringify(data)));

      load();
    } catch (e) {
      alert("Failed to update");
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-600">Loading student data…</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!profile) return <div className="p-6">No profile found.</div>;

  // Progress %
  const progress = timeline.length
    ? Math.round(
        (timeline.filter((t) => t.status === "Completed").length /
          timeline.length) *
          100
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      {/* PAGE TITLE */}
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
        🎓 Student Dashboard
      </h1>

      {/* STUDENT CARD */}
      <div className="bg-white shadow-card rounded-2xl p-6 mb-10 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          {profile.student_name}
        </h2>

        <p className="text-gray-600 mb-1">{profile.email}</p>
        <p className="text-gray-600 mb-1">
          <strong>Programme:</strong> {profile.programme}
        </p>
        <p className="text-gray-600 mb-1">
          <strong>Supervisor:</strong> {profile.supervisor}
        </p>
        <p className="text-gray-600 mb-1">
          <strong>Field:</strong> {profile.field}
        </p>
        <p className="text-gray-600 mb-4">
          <strong>Start Date:</strong> {profile.start_date}
        </p>

        {/* PROGRESS BAR */}
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-semibold text-purple-700">{progress}%</span>
          </div>

          <div className="w-full bg-gray-200 h-3 rounded-full">
            <div
              className="bg-purple-600 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* TIMELINE TABLE */}
      <div className="bg-white shadow-card rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          📅 Expected vs Actual Timeline
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-50 text-purple-700">
                <th className="p-3 text-left">Activity</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Actual</th>
                <th className="p-3">Status</th>
                <th className="p-3">Remaining</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {timeline.map((t, i) => {
                const isLate =
                  !t.actual && t.remaining_days < 0 && t.status !== "Completed";

                return (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-3">{t.activity}</td>
                    <td className="p-3 text-gray-700">{t.expected || "-"}</td>
                    <td className="p-3 text-gray-700">{t.actual || "-"}</td>

                    {/* STATUS */}
                    <td
                      className={`p-3 font-medium ${
                        t.status === "Completed"
                          ? "text-green-600"
                          : isLate
                          ? "text-red-600"
                          : "text-gray-700"
                      }`}
                    >
                      {isLate ? "Delayed" : t.status}
                    </td>

                    {/* REMAINING DAYS */}
                    <td
                      className={`p-3 ${
                        isLate ? "text-red-600 font-semibold" : ""
                      }`}
                    >
                      {t.remaining_days}
                    </td>

                    {/* ACTION BUTTON */}
                    <td className="p-3">
                      {!t.actual && (
                        <button
                          onClick={() => markCompleted(t.activity)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-400 text-white font-semibold shadow hover:opacity-90 transition"
                        >
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
