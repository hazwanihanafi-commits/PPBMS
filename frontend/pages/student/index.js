import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import StudentChecklist from "../../components/StudentChecklist";

export default function StudentPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  /* ================= LOAD DATA ================= */
  async function load() {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("ppbms_token");
    if (!token) {
      router.push("/login");
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
        setError("Invalid server response");
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
      setError("Unable to load student data");
    }

    setLoading(false);
  }

  /* ================= ACTIONS ================= */
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

    load();
  }

  async function resetCompleted(activity) {
    const token = localStorage.getItem("ppbms_token");

    await fetch(`${API_BASE}/api/student/reset-actual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ activity }),
    });

    load();
  }

  function logout() {
    localStorage.clear();
    router.push("/login");
  }

  /* ================= UI STATES ================= */
  if (loading) {
    return (
      <div className="p-10 text-center text-gray-600">
        Loading student data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  if (!profile) return null;

  /* ================= PROGRESS ================= */
  const progress = timeline.length
    ? Math.round(
        (timeline.filter(t => t.status === "Completed").length /
          timeline.length) *
          100
      )
    : 0;

  /* ================= PAGE ================= */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            🎓 Student Dashboard
          </h1>
          <p className="text-gray-600">
            {profile.programme} · {profile.field}
          </p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Overall Progress</p>
          <p className="text-3xl font-bold text-purple-700">{progress}%</p>
          <div className="mt-3 h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-purple-600 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Main Supervisor</p>
          <p className="font-semibold">{profile.supervisor}</p>
          <p className="text-sm text-gray-500 mt-2">Co-supervisors</p>
          <p>{profile.cosupervisors || "-"}</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Start Date</p>
          <p className="font-semibold">{profile.start_date}</p>
          <p className="text-sm text-gray-500 mt-2">Department</p>
          <p>{profile.department}</p>
        </div>
      </div>

      {/* PROFILE */}
      <div className="bg-white rounded-2xl shadow p-6 mb-10">
        <h2 className="text-lg font-bold mb-4">👤 Student Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <p><strong>Name:</strong> {profile.student_name}</p>
          <p><strong>Matric No:</strong> {profile.matric}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Status:</strong> {profile.status}</p>
        </div>
      </div>

      {/* DOCUMENTS */}
      <div className="mb-12">
        <h2 className="text-lg font-bold mb-4">
          📂 Research Documents Checklist
        </h2>
        <StudentChecklist initialDocuments={profile.documents} />
      </div>

      {/* TIMELINE */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-bold mb-4">
          📅 Expected vs Actual Timeline
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Activity</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Actual</th>
                <th className="p-3">Status</th>
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
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          t.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : isLate
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {isLate ? "Delayed" : t.status}
                      </span>
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() =>
                          t.actual
                            ? resetCompleted(t.activity)
                            : markCompleted(t.activity)
                        }
                        className={`px-4 py-2 rounded-xl text-white text-xs font-semibold ${
                          t.actual
                            ? "bg-gray-500 hover:bg-gray-600"
                            : "bg-purple-600 hover:bg-purple-700"
                        }`}
                      >
                        {t.actual ? "Reset" : "Mark Completed"}
                      </button>
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
