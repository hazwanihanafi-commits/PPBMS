import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import StudentChecklist from "../../components/StudentChecklist";

/* =========================================================
   STUDENT DASHBOARD (TAB-BASED, SAFE VERSION)
========================================================= */
export default function StudentPage() {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [activeTab, setActiveTab] = useState("documents");

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (typeof window !== "undefined") load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

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

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        console.error("NON-JSON RESPONSE:", text);
        setError("Invalid backend response");
        return;
      }

      if (!res.ok || data.error) {
        setError(data.error || "Failed to load student data");
      } else {
        setProfile(data.row);
        setTimeline(data.row.timeline || []);
      }
    } catch (e) {
      console.error(e);
      setError("Unable to load student data.");
    }

    setLoading(false);
  }

  /* ================= MARK COMPLETED ================= */
  async function markCompleted(activity) {
    const token = localStorage.getItem("ppbms_token");
    if (!token) return;

    const date = new Date().toISOString().slice(0, 10);

    const res = await fetch(`${API_BASE}/api/student/update-actual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ activity, date }),
    });

    if (res.ok) load();
    else alert("Failed to update activity");
  }

  /* ================= LOGOUT ================= */
  function logout() {
    localStorage.removeItem("ppbms_token");
    localStorage.removeItem("ppbms_role");
    localStorage.removeItem("ppbms_email");
    router.push("/login");
  }

  /* ================= UI STATES ================= */
  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading student data…</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  if (!profile) {
    return <div className="p-6">No profile found.</div>;
  }

  /* ================= CALCULATIONS ================= */
  const progress = timeline.length
    ? Math.round(
        (timeline.filter(t => t.status === "Completed").length / timeline.length) * 100
      )
    : 0;

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">
          🎓 Student Dashboard
        </h1>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* PROFILE CARD */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8 border">
        <h2 className="text-xl font-bold mb-2">{profile.student_name}</h2>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <p><strong>Matric:</strong> {profile.student_id}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Programme:</strong> {profile.programme}</p>
          <p><strong>Field:</strong> {profile.field}</p>
          <p><strong>Department:</strong> {profile.department}</p>
          <p><strong>Start Date:</strong> {profile.start_date}</p>
          <p><strong>Main Supervisor:</strong> {profile.supervisor}</p>
          <p><strong>Co-supervisors:</strong> {profile.cosupervisors}</p>
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Overall Progress</span>
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

      {/* TABS */}
      <div className="flex border-b mb-6">
        {[
          { id: "documents", label: "📂 Documents" },
          { id: "timeline", label: "📅 Timeline" },
          { id: "activity", label: "📝 Activity Log" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-semibold ${
              activeTab === tab.id
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DOCUMENTS TAB */}
      {activeTab === "documents" && (
        <StudentChecklist initialDocuments={profile.documents} />
      )}

      {/* TIMELINE TAB */}
      {activeTab === "timeline" && (
        <div className="bg-white rounded-2xl shadow p-6 border">
          <h3 className="text-lg font-bold mb-4">Expected vs Actual Timeline</h3>

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
                      <td className={`p-3 font-medium ${
                        t.status === "Completed"
                          ? "text-green-600"
                          : isLate
                          ? "text-red-600"
                          : "text-gray-700"
                      }`}>
                        {isLate ? "Delayed" : t.status}
                      </td>
                      <td className={`p-3 ${isLate ? "text-red-600 font-semibold" : ""}`}>
                        {t.remaining_days}
                      </td>
                      <td className="p-3">
                        {!t.actual && (
                          <button
                            onClick={() => markCompleted(t.activity)}
                            className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
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
      )}

      {/* ACTIVITY LOG TAB */}
      {activeTab === "activity" && (
        <div className="bg-white rounded-2xl shadow p-6 border">
          <h3 className="text-lg font-bold mb-4">Activity Log</h3>
          <p className="text-gray-500 text-sm">
            This will record document uploads, timeline completions,
            and system alerts (next phase).
          </p>
        </div>
      )}
    </div>
  );
}
