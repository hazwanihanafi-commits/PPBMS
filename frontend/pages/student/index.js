import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import { useAuthGuard } from "@/utils/useAuthGuard";
import StudentChecklist from "../../components/StudentChecklist";
import TopBar from "../../components/TopBar";

export default function StudentPage() {
  const { ready, user } = useAuthGuard("student");

  /* ================= STATE ================= */
  const [profile, setProfile] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!ready) return;
    loadStudent();
  }, [ready]);

  async function loadStudent() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("ppbms_token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE}/api/student/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Load failed");

      setProfile(data.row);
      setTimeline(data.row.timeline || []);
    } catch (e) {
      setError(e.message || "Unable to load student data");
    }

    setLoading(false);
  }

  /* ================= MARK COMPLETED ================= */
  async function markCompleted(activity) {
    const token = localStorage.getItem("ppbms_token");
    if (!token) {
      alert("Not authenticated");
      return;
    }

    const date = new Date().toISOString().slice(0, 10);

    try {
      const res = await fetch(`${API_BASE}/api/student/update-actual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activity, date }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update actual date");
        return;
      }

      loadStudent(); // 🔄 refresh
    } catch {
      alert("Failed to update actual date");
    }
  }

  /* ================= GUARDS ================= */
  if (!ready) return <div className="p-6 text-center">Checking access…</div>;
  if (loading) return <div className="p-6 text-center">Loading…</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!profile) return null;

  /* ================= CALCULATIONS ================= */
  const progress = timeline.length
    ? Math.round(
        (timeline.filter(t => t.status === "Completed").length / timeline.length) * 100
      )
    : 0;

  /* ================= RENDER ================= */
  return (
    <>
      <TopBar user={user} />

      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">

        {/* ================= PROFILE ================= */}
        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <h1 className="text-2xl font-extrabold mb-3">🎓 Student Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><strong>Name:</strong> {profile.student_name}</div>
            <div><strong>Matric:</strong> {profile.student_id}</div>
            <div><strong>Email:</strong> {profile.email}</div>
            <div><strong>Programme:</strong> {profile.programme}</div>
            <div><strong>Field:</strong> {profile.field}</div>
            <div><strong>Main Supervisor:</strong> {profile.supervisor}</div>
            <div><strong>Co-Supervisor(s):</strong> {profile.cosupervisors}</div>
          </div>

          {/* PROGRESS */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Progress</span>
              <span className="font-semibold text-purple-700">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded-full">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* ================= DOCUMENTS ================= */}
        <div className="mb-10">
          <StudentChecklist initialDocuments={profile.documents} />
        </div>

        {/* ================= TIMELINE ================= */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-bold mb-4">
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
                      <td className="p-3">{t.expected || "-"}</td>
                      <td className="p-3">{t.actual || "-"}</td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            t.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : isLate
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isLate ? "Delayed" : t.status}
                        </span>
                      </td>

                      <td className={`p-3 ${isLate ? "text-red-600 font-semibold" : ""}`}>
                        {t.remaining_days ?? "-"}
                      </td>

                      <td className="p-3">
                        {!t.actual && (
                          <button
                            onClick={() => markCompleted(t.activity)}
                            className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700"
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
    </>
  );
}
