import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import StudentChecklist from "../../components/StudentChecklist";
import TopBar from "../../components/TopBar";

/* =========================
   DELAY SUMMARY BADGES
========================= */
function DelaySummaryBadges({ timeline }) {
  const count = (s) => timeline.filter(t => t.status === s).length;

  const Badge = ({ label, value, color }) => (
    <div className={`rounded-xl px-4 py-3 ${color}`}>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Badge label="Late" value={count("Late")} color="bg-red-100 text-red-700" />
      <Badge label="Due Soon" value={count("Due Soon")} color="bg-yellow-100 text-yellow-700" />
      <Badge label="On Time" value={count("On Time")} color="bg-blue-100 text-blue-700" />
      <Badge label="Completed" value={count("Completed")} color="bg-green-100 text-green-700" />
    </div>
  );
}

/* =========================
   TABS
========================= */
function Tabs({ active, setActive }) {
  const Tab = ({ id, label }) => (
    <button
      onClick={() => setActive(id)}
      className={`px-4 py-2 rounded-xl font-semibold transition ${
        active === id
          ? "bg-purple-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex gap-3 mb-6">
      <Tab id="overview" label="Overview" />
      <Tab id="timeline" label="Timeline" />
      <Tab id="documents" label="Documents" />
    </div>
  );
}

/* =========================
   MAIN PAGE
========================= */
export default function StudentPage() {
  const [profile, setProfile] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
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
      if (!res.ok) throw new Error(data.error || "Failed");

      setProfile(data.row);
      setTimeline(data.row.timeline || []);
    } catch {
      setError("Unable to load student data");
    }

    setLoading(false);
  }

  /* =========================
     MARK COMPLETED / RESET
  ========================= */
  async function markCompleted(activity, reset = false) {
    const token = localStorage.getItem("ppbms_token");
    if (!token) return;

    const date = reset ? "" : new Date().toISOString().slice(0, 10);

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

  if (loading) return <div className="p-6 text-center">Loading…</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!profile) return null;

  const progress = timeline.length
    ? Math.round(
        (timeline.filter(t => t.status === "Completed").length / timeline.length) * 100
      )
    : 0;

  return (
  <>
    <TopBar />
     
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
          <div><strong>Start Date:</strong> {profile.start_date}</div>
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

      {/* DELAY BADGES */}
      <DelaySummaryBadges timeline={timeline} />

      {/* TABS */}
      <Tabs active={activeTab} setActive={setActiveTab} />

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="bg-white p-6 rounded-2xl shadow text-gray-700">
          This dashboard tracks your postgraduate milestones, timelines,
          and document submissions according to programme requirements.
        </div>
      )}

      {/* DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="bg-white p-6 rounded-2xl shadow">
          <StudentChecklist initialDocuments={profile.documents} />
        </div>
      )}

      {/* TIMELINE */}
      {activeTab === "timeline" && (
        <div className="bg-white p-6 rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-50 text-purple-700">
                <th className="p-3 text-left">Activity</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Actual</th>
                <th className="p-3">Status</th>
                <th className="p-3">Remaining</th>
                <th className="p-3">Remark</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {timeline.map((t, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{t.activity}</td>
                  <td className="p-3 text-center">{t.expected || "-"}</td>
                  <td className="p-3 text-center">{t.actual || "-"}</td>

                  <td className={`p-3 text-center font-semibold ${
                    t.status === "Completed"
                      ? "text-green-600"
                      : t.status === "Late"
                      ? "text-red-600"
                      : t.status === "Due Soon"
                      ? "text-yellow-600"
                      : "text-blue-600"
                  }`}>
                    {t.status}
                  </td>

                  <td className="p-3 text-center">
                    {t.remaining_days !== "" ? t.remaining_days : "-"}
                  </td>

                  <td className="p-3">
                    <textarea
                      defaultValue={t.remark || ""}
                      placeholder="Add remark…"
                      className="w-56 border rounded-lg p-2 text-xs"
                      onBlur={async (e) => {
                        const token = localStorage.getItem("ppbms_token");
                        if (!token) return;

                        await fetch(`${API_BASE}/api/student/update-remark`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            activity: t.activity,
                            remark: e.target.value,
                          }),
                        });

                        load();
                      }}
                    />
                  </td>

                  <td className="p-3 text-center">
                    {!t.actual ? (
                      <button
                        onClick={() => markCompleted(t.activity)}
                        className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold"
                      >
                        ✔ Complete
                      </button>
                    ) : (
                      <button
                        onClick={() => markCompleted(t.activity, true)}
                        className="px-3 py-1 rounded-lg bg-gray-500 text-white text-xs font-semibold"
                      >
                        ↺ Reset
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
