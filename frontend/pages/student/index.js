import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import StudentChecklist from "../../components/StudentChecklist";
import StatusBadge from "../../components/StatusBadge";
import DelaySummaryBadges from "../../components/DelaySummaryBadges";
import Tabs from "../../components/Tabs";

export default function StudentPage() {
  const [profile, setProfile] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Documents");

  useEffect(() => {
    load();
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");

      setProfile(data.row);
      setTimeline(data.row.timeline || []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Unable to load student data");
    }

    setLoading(false);
  }

  async function updateActual(activity, date, remark = "") {
    const token = localStorage.getItem("ppbms_token");
    if (!token) return;

    try {
      await fetch(`${API_BASE}/api/student/update-actual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activity, date, remark }),
      });

      load();
    } catch {
      alert("Update failed");
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading…</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  if (!profile) {
    return <div className="p-6">No profile found.</div>;
  }

  /* ================= PROGRESS ================= */
  const completedCount = timeline.filter(t => t.status === "Completed").length;
  const progress = timeline.length
    ? Math.round((completedCount / timeline.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 space-y-8">

      {/* ================= PROFILE SUMMARY ================= */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-extrabold mb-2">
          🎓 {profile.student_name}
        </h1>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <p><strong>Matric:</strong> {profile.matric}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Programme:</strong> {profile.programme}</p>
          <p><strong>Field:</strong> {profile.field}</p>
          <p><strong>Department:</strong> {profile.department}</p>
          <p><strong>Start Date:</strong> {profile.start_date}</p>
          <p><strong>Main Supervisor:</strong> {profile.supervisor}</p>
          <p><strong>Co-supervisors:</strong> {profile.cosupervisors || "-"}</p>
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-4">
          <div className="flex justify-between mb-1 text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="font-semibold text-purple-700">{progress}%</span>
          </div>

          <div className="w-full bg-gray-200 h-3 rounded-full">
            <div
              className="bg-purple-600 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* DELAY BADGES */}
        <DelaySummaryBadges timeline={timeline} />
      </div>

      {/* ================= TABS ================= */}
      <Tabs
        tabs={["Documents", "Timeline"]}
        active={activeTab}
        setActive={setActiveTab}
      />

      {/* ================= DOCUMENTS TAB ================= */}
      {activeTab === "Documents" && (
        <StudentChecklist initialDocuments={profile.documents} />
      )}

      {/* ================= TIMELINE TAB ================= */}
      {activeTab === "Timeline" && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold mb-4">
            📅 Expected vs Actual Timeline
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-purple-50 text-purple-700">
                <tr>
                  <th className="p-3 text-left">Activity</th>
                  <th className="p-3">Expected</th>
                  <th className="p-3">Actual</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Remaining (days)</th>
                  <th className="p-3">Remark</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {timeline.map((t, i) => {
                  const isLate = !t.actual && t.remaining_days < 0;

                  return (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{t.activity}</td>
                      <td className="p-3">{t.expected || "-"}</td>
                      <td className="p-3">{t.actual || "-"}</td>

                      <td className="p-3">
                        <StatusBadge status={t.status} isLate={isLate} />
                      </td>

                      <td
                        className={`p-3 ${
                          isLate ? "text-red-600 font-semibold" : ""
                        }`}
                      >
                        {t.remaining_days}
                      </td>

                      <td className="p-3">
                        <textarea
                          className="w-full border rounded-lg p-2 text-sm"
                          placeholder="Optional remark / justification"
                          value={t.remark || ""}
                          onChange={(e) =>
                            setTimeline(prev =>
                              prev.map(x =>
                                x.activity === t.activity
                                  ? { ...x, remark: e.target.value }
                                  : x
                              )
                            )
                          }
                        />
                      </td>

                      <td className="p-3 space-y-2">
                        {!t.actual && (
                          <button
                            onClick={() =>
                              updateActual(
                                t.activity,
                                new Date().toISOString().slice(0, 10),
                                t.remark || ""
                              )
                            }
                            className="px-3 py-1 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
                          >
                            Mark Completed
                          </button>
                        )}

                        {t.actual && (
                          <button
                            onClick={() =>
                              updateActual(t.activity, "", "")
                            }
                            className="px-3 py-1 rounded-xl bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300"
                          >
                            Reset
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
    </div>
  );
}
