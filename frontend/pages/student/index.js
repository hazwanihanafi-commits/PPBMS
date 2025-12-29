import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import { useAuthGuard } from "@/utils/useAuthGuard";
import StudentChecklist from "../../components/StudentChecklist";
import TimelineSummary from "../../components/TimelineSummary";
import CompletionDonut from "../../components/CompletionDonut";
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
      if (!res.ok) throw new Error(data.error);

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
    const date = new Date().toISOString().slice(0, 10);

    await fetch(`${API_BASE}/api/student/update-actual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ activity, date }),
    });

    loadStudent();
  }

  async function resetCompleted(activity) {
  if (!confirm("Are you sure you want to reset this milestone?")) return;

  const token = localStorage.getItem("ppbms_token");

  await fetch(`${API_BASE}/api/student/reset-actual`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ activity }),
  });

  loadStudent(); // refresh timeline
}

  

  /* ================= SUMMARY ================= */
  const completed = timeline.filter(t => t.status === "Completed").length;
  const late = timeline.filter(
    t => !t.actual && t.remaining_days < 0 && t.status !== "Completed"
  ).length;

  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  const nextMilestone = timeline.find(t => t.status !== "Completed");

  /* ================= AUTO ALERT ================= */
  useEffect(() => {
    const prevLate = Number(localStorage.getItem("ppbms_prev_late") || 0);
    if (late > prevLate) {
      alert(`⚠️ ${late - prevLate} new milestone(s) are now LATE`);
    }
    localStorage.setItem("ppbms_prev_late", late);
  }, [late]);

  /* ================= GUARDS ================= */
  if (!ready) return <div className="p-6 text-center">Checking access…</div>;
  if (loading) return <div className="p-6 text-center">Loading…</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  /* ================= RENDER ================= */
  return (
    <>
      <TopBar user={user} />

      <div className="min-h-screen bg-purple-50 p-6 space-y-6">

        {/* ================= HERO ================= */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {profile.student_name} 🎓
              </h1>
              <p className="text-purple-100 mt-1">
                You have completed {completed} of {timeline.length} milestones
              </p>
            </div>

            {nextMilestone && (
              <div className="bg-white text-gray-800 rounded-xl p-4 shadow min-w-[260px]">
                <p className="text-xs uppercase font-semibold text-gray-500">
                  Next Milestone
                </p>
                <p className="font-bold">{nextMilestone.activity}</p>
                <p className="text-sm text-gray-600">
                  Due in{" "}
                  <span className="font-semibold">
                    {nextMilestone.remaining_days}
                  </span>{" "}
                  days
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================= PROFILE ================= */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold mb-3">Your Profile</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <p><strong>Matric:</strong> {profile.student_id}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Programme:</strong> {profile.programme}</p>
            <p><strong>Field:</strong> {profile.field || "-"}</p>
            <p><strong>Department:</strong> {profile.department || "-"}</p>
            <p><strong>Main Supervisor:</strong> {profile.supervisor || "-"}</p>
          </div>
        </div>

        {/* ================= DONUT + SUMMARY ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow p-4 flex justify-center">
            <CompletionDonut percent={progress} />
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl shadow p-4">
            <TimelineSummary timeline={timeline} />
          </div>
        </div>

        {/* ================= TABS ================= */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-4 py-2 rounded-xl font-semibold ${
              activeTab === "timeline"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📅 Timeline
          </button>

          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2 rounded-xl font-semibold ${
              activeTab === "documents"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📁 Documents
          </button>
        </div>

        {/* ================= TIMELINE TAB ================= */}
        {activeTab === "timeline" && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-bold mb-4">Your Research Timeline</h3>

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50">
                  <th className="p-2 text-left">Activity</th>
                  <th className="p-2">Expected</th>
                  <th className="p-2">Actual</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>

              <tbody>
                {timeline.map((t, i) => {
                  const isLate =
                    !t.actual && t.remaining_days < 0 && t.status !== "Completed";

                  return (
                    <tr
                      key={i}
                      className={`border-t ${
                        isLate
                          ? "bg-red-50"
                          : t.remaining_days <= 30 && !t.actual
                          ? "bg-orange-50"
                          : ""
                      }`}
                    >
                      <td className="p-2">{t.activity}</td>
                      <td className="p-2">{t.expected || "-"}</td>
                      <td className="p-2">{t.actual || "-"}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            t.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : isLate
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isLate
                            ? "Late – action needed"
                            : t.status === "Completed"
                            ? "Completed ✔"
                            : "On track"}
                        </span>
                      </td>
                      <td className="p-2">
  {t.actual ? (
    <button
      onClick={() => resetCompleted(t.activity)}
      className="px-3 py-1 text-xs border border-red-400 text-red-600 rounded hover:bg-red-50"
    >
      Reset completion
    </button>
  ) : (
    <button
      onClick={() => markCompleted(t.activity)}
      className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
    >
      I’ve completed this
    </button>
  )}
</td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= DOCUMENTS TAB ================= */}
        {activeTab === "documents" && (
          <div className="bg-white rounded-2xl shadow p-6">
            <StudentChecklist initialDocuments={profile.documents} />
          </div>
        )}
      </div>
    </>
  );
}
