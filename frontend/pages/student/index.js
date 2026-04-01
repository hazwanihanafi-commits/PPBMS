import { useEffect, useState } from "react";
import { useAuthGuard } from "@/utils/useAuthGuard";
import { authFetch } from "@/utils/authFetch";

import StudentChecklist from "../../components/StudentChecklist";
import TimelineSummary from "../../components/TimelineSummary";
import CompletionDonut from "../../components/CompletionDonut";
import TopBar from "../../components/TopBar";

export default function StudentPage() {
  const { ready, user } = useAuthGuard("student");

  const [profile, setProfile] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState("timeline");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    loadStudent();
  }, [ready]);

  async function loadStudent() {
    setLoading(true);
    setError("");

    try {
      const res = await authFetch("/api/student/me");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setProfile(data.row);
      setTimeline(data.row.timeline || []);
    } catch (e) {
      if (e.message === "NO_TOKEN") {
        window.location.href = "/login";
        return;
      }
      setError(e.message || "Unable to load student data");
    }

    setLoading(false);
  }

  async function markCompleted(activity) {
    const date = new Date().toISOString().slice(0, 10);

    await authFetch("/api/student/update-actual", {
      method: "POST",
      body: JSON.stringify({ activity, date }),
    });

    loadStudent();
  }

  async function resetCompleted(activity) {
    if (!confirm("Reset this milestone?")) return;

    await authFetch("/api/student/reset-actual", {
      method: "POST",
      body: JSON.stringify({ activity }),
    });

    loadStudent();
  }

  const completed = timeline.filter(t => t.status === "Completed").length;
  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  const nextMilestone = timeline.find(t => t.status !== "Completed");

  if (!ready) return <div className="p-6 text-center">Checking access…</div>;
  if (loading) return <div className="p-6 text-center">Loading…</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <>
      <TopBar user={user} />

      <div className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#ede9fe] p-6 space-y-6">

        {/* HERO */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white p-6 shadow-xl">
          <h1 className="text-2xl font-bold">
            Welcome back, {profile.student_name} 🎓
          </h1>
          <p className="text-purple-100 mt-1">
            {completed} / {timeline.length} milestones completed
          </p>
        </div>

        {/* PROFILE */}
        <div className="rounded-3xl bg-white/50 backdrop-blur-xl border shadow-xl p-6">
          <h2 className="font-bold mb-3">Profile</h2>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <p><strong>Matric:</strong> {profile.student_id}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Programme:</strong> {profile.programme}</p>
            <p><strong>Supervisor:</strong> {profile.supervisor}</p>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-white/50 backdrop-blur-xl p-4 shadow-xl">
            <CompletionDonut percent={progress} />
          </div>

          <div className="md:col-span-2 rounded-3xl bg-white/50 backdrop-blur-xl p-4 shadow-xl">
            <TimelineSummary timeline={timeline} />
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-3">
          {["timeline", "documents"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full font-semibold ${
                activeTab === tab
                  ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white"
                  : "bg-white/50"
              }`}
            >
              {tab === "timeline" ? "📅 Timeline" : "📁 Documents"}
            </button>
          ))}
        </div>

        {/* TIMELINE (CARD STYLE) */}
        {activeTab === "timeline" && (
          <div className="grid gap-4">
            {timeline.map((t, i) => {
              const isLate =
                !t.actual && t.remaining_days < 0 && t.status !== "Completed";

              return (
                <div
                  key={i}
                  className={`rounded-2xl p-4 shadow border ${
                    isLate
                      ? "bg-red-50 border-red-200"
                      : "bg-white/50 backdrop-blur"
                  }`}
                >
                  <div className="flex justify-between mb-2">
                    <h4 className="font-semibold">{t.activity}</h4>
                    <span className="text-sm font-bold text-purple-700">
                      {t.remaining_days} days
                    </span>
                  </div>

                  <p className="text-sm text-gray-600">
                    Expected: {t.expected || "-"} | Actual: {t.actual || "-"}
                  </p>

                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs font-semibold">
                      {isLate ? "⚠️ Late" : t.status}
                    </span>

                    {t.actual ? (
                      <button
                        onClick={() => resetCompleted(t.activity)}
                        className="text-xs text-red-600"
                      >
                        Reset
                      </button>
                    ) : (
                      <button
                        onClick={() => markCompleted(t.activity)}
                        className="text-xs text-purple-700"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="rounded-3xl bg-white/50 backdrop-blur-xl p-6 shadow-xl">
            <StudentChecklist initialDocuments={profile.documents} />
          </div>
        )}

        {/* FOOTER */}
        <footer className="text-center text-xs text-gray-400 py-6 border-t mt-10">
          © 2026 PPBMS · Universiti Sains Malaysia
          <br />
          Developed by <span className="font-medium text-gray-600">Hazwani Ahmad Yusof</span> (2025)
        </footer>

      </div>
    </>
  );
}
