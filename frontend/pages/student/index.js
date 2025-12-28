import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import { useAuthGuard } from "@/utils/useAuthGuard";
import StudentChecklist from "../../components/StudentChecklist";
import TopBar from "../../components/TopBar";

/* =========================
   PAGE
========================= */
export default function StudentPage() {
  const { ready, user } = useAuthGuard("student");

  const [profile, setProfile] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================
     LOAD STUDENT DATA
  ========================= */
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Load failed");

      setProfile(data.row);
      setTimeline(data.row.timeline || []);
    } catch (e) {
      setError("Unable to load student data");
    }

    setLoading(false);
  }

  /* =========================
     EARLY RETURNS (NO BLINK)
  ========================= */
  if (!ready) {
    return <div className="p-6 text-center">Checking access…</div>;
  }

  if (loading) {
    return <div className="p-6 text-center">Loading…</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  if (!profile) return null;

  /* =========================
     CALCULATIONS
  ========================= */
  const progress = timeline.length
    ? Math.round(
        (timeline.filter(t => t.status === "Completed").length / timeline.length) * 100
      )
    : 0;

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      <TopBar user={user} />

      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
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

        {/* YOUR EXISTING TABS / TIMELINE / DOCUMENTS CONTINUE HERE */}
      </div>
    </>
  );
}
