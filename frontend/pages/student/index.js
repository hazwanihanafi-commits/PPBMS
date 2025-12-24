import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import StudentChecklist from "../../components/StudentChecklist";
import StatusBadge from "../../components/StatusBadge";

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
    const token = localStorage.getItem("ppbms_token");
    if (!token) return setError("Not authenticated");

    try {
      const res = await fetch(`${API_BASE}/api/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfile(data.row);
      setTimeline(data.row.timeline || []);
    } catch (e) {
      setError(e.message || "Load failed");
    }

    setLoading(false);
  }

  async function updateActual(activity, date, remark = "") {
    const token = localStorage.getItem("ppbms_token");

    await fetch(`${API_BASE}/api/student/update-actual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ activity, date, remark }),
    });

    load();
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const progress = timeline.length
    ? Math.round(
        (timeline.filter(t => t.status === "Completed").length /
          timeline.length) *
          100
      )
    : 0;

  return (
    <div className="p-6 space-y-8 bg-purple-50 min-h-screen">

      {/* PROFILE */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold">{profile.student_name}</h1>
        <p>{profile.programme}</p>
        <p>Supervisor: {profile.supervisor}</p>

        <div className="mt-4">
          <div className="w-full bg-gray-200 h-3 rounded">
            <div
              className="bg-purple-600 h-3 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm mt-1">{progress}% completed</p>
        </div>
      </div>

      {/* DOCUMENTS TAB */}
      <StudentChecklist initialDocuments={profile.documents} />

      {/* TIMELINE */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold mb-4">Timeline</h2>

        <table className="w-full text-sm">
          <thead className="bg-purple-100">
            <tr>
              <th className="p-2 text-left">Activity</th>
              <th className="p-2">Expected</th>
              <th className="p-2">Actual</th>
              <th className="p-2">Status</th>
              <th className="p-2">Remark</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {timeline.map((t, i) => {
              const isLate = !t.actual && t.remaining_days < 0;

              return (
                <tr key={i} className="border-t">
                  <td className="p-2">{t.activity}</td>
                  <td className="p-2">{t.expected || "-"}</td>
                  <td className="p-2">{t.actual || "-"}</td>
                  <td className="p-2">
                    <StatusBadge status={t.status} isLate={isLate} />
                  </td>

                  <td className="p-2">
                    <textarea
                      className="w-full border rounded p-1 text-sm"
                      value={t.remark || ""}
                      onChange={e =>
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

                  <td className="p-2 space-y-1">
                    {!t.actual && (
                      <button
                        className="px-3 py-1 bg-green-600 text-white rounded"
                        onClick={() =>
                          updateActual(
                            t.activity,
                            new Date().toISOString().slice(0, 10),
                            t.remark
                          )
                        }
                      >
                        Complete
                      </button>
                    )}

                    {t.actual && (
                      <button
                        className="px-3 py-1 bg-gray-300 rounded"
                        onClick={() => updateActual(t.activity, "", "")}
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
  );
}
