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
  const [activeTab, setActiveTab] = useState("timeline");
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

      const res = await fetch(`${API_BASE}/api/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error();

      setProfile(data.row);
      setTimeline(data.row.timeline || []);
    } catch {
      setError("Unable to load student data");
    }

    setLoading(false);
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

      {/* PAGE TITLE */}
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
        🎓 Student Dashboard
      </h1>

      {/* ===============================
          STUDENT PROFILE CARD
      =============================== */}
      <div className="bg-white shadow-card rounded-2xl p-6 mb-10 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          {profile.student_name}
        </h2>

        <p className="text-gray-600 mb-1">
          <strong>Matric:</strong> {profile.matric}
        </p>

        <p className="text-gray-600 mb-1">
          <strong>Email:</strong> {profile.email}
        </p>

        <p className="text-gray-600 mb-1">
          <strong>Programme:</strong> {profile.programme}
        </p>

        <p className="text-gray-600 mb-1">
          <strong>Field:</strong> {profile.field}
        </p>

        <p className="text-gray-600 mb-1">
          <strong>Department:</strong> {profile.department}
        </p>

        <p className="text-gray-600 mb-1">
          <strong>Main Supervisor:</strong> {profile.supervisor}
        </p>

        <p className="text-gray-600 mb-1">
          <strong>Co-supervisors:</strong> {profile.cosupervisors}
        </p>

        <p className="text-gray-600 mb-4">
          <strong>Start Date:</strong> {profile.start_date}
        </p>

        {/* PROGRESS BAR */}
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-sm font-semibold text-purple-700">
              {progress}%
            </span>
          </div>

          <div className="w-full bg-gray-200 h-3 rounded-full">
            <div
              className="bg-purple-600 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ===============================
          STUDENT CHECKLIST (A–F)
      =============================== */}
     <div className="mb-10">
  <StudentChecklist initialDocuments={profile.documents} /> {/* ✅ FIX */}
</div>

      {/* ===============================
          EXPECTED vs ACTUAL TIMELINE
      =============================== */}
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
                    <td className="p-3">{t.expected || "-"}</td>
                    <td className="p-3">{t.actual || "-"}</td>

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

                    <td
                      className={`p-3 ${
                        isLate ? "text-red-600 font-semibold" : ""
                      }`}
                    >
                      {t.remaining_days}
                    </td>

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
