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

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
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
                className="bg-purple-600 h-3 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-4 py-2 rounded-xl font-semibold ${
              activeTab === "timeline"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Timeline
          </button>

          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2 rounded-xl font-semibold ${
              activeTab === "documents"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Documents
          </button>
        </div>

        {/* TIMELINE */}
        {activeTab === "timeline" && (
          <div className="bg-white p-6 rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-purple-50">
                <tr>
                  <th>Activity</th>
                  <th>Expected</th>
                  <th>Actual</th>
                  <th>Status</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((t, i) => (
                  <tr key={i} className="border-t">
                    <td>{t.activity}</td>
                    <td>{t.expected || "-"}</td>
                    <td>{t.actual || "-"}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs ${
                        t.status === "Late"
                          ? "bg-red-100 text-red-700"
                          : t.status === "Due Soon"
                          ? "bg-yellow-100 text-yellow-700"
                          : t.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{t.remaining_days ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="bg-white p-6 rounded-2xl shadow">
            <StudentChecklist initialDocuments={profile.documents} />
          </div>
        )}
      </div>
    </>
  );
}
