import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../../utils/api";

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
      <Tab id="cqi" label="CQI & PLO" />
    </div>
  );
}

/* =========================
   MAIN PAGE
========================= */
export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cqi, setCqi] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const emailTriggeredRef = useRef(false); // 🔐 prevent duplicate email

  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  async function loadStudent() {
    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStudent(data.row);
      setTimeline(data.row.timeline || []);
      setCqi(data.row.cqiByAssessment || {});

    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     AUTO EMAIL WHEN LATE > 0
  ========================== */
  useEffect(() => {
    if (!timeline.length || emailTriggeredRef.current) return;

    const lateCount = timeline.filter(t => t.status === "Late").length;
    if (lateCount > 0) {
      emailTriggeredRef.current = true;

      fetch(`${API_BASE}/alerts/run-delay-alert`, {
        method: "POST",
      }).catch(() => {});
    }
  }, [timeline]);

  if (loading) return <div className="p-6 text-center">Loading…</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  const progress = timeline.length
    ? Math.round(
        (timeline.filter(t => t.status === "Completed").length /
          timeline.length) * 100
      )
    : 0;

  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-6">

      {/* ================= HEADER ================= */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-extrabold mb-3">🎓 Student Progress (Supervisor View)</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div><strong>Name:</strong> {student.student_name}</div>
          <div><strong>Matric:</strong> {student.student_id}</div>
          <div><strong>Email:</strong> {student.email}</div>
          <div><strong>Programme:</strong> {student.programme}</div>
          <div><strong>Field:</strong> {student.field}</div>
          <div><strong>Start Date:</strong> {student.start_date}</div>
          <div><strong>Main Supervisor:</strong> {student.supervisor}</div>
          <div><strong>Co-Supervisor(s):</strong> {student.cosupervisors}</div>
        </div>

        {/* Progress bar */}
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

      {/* 🔔 DELAY SUMMARY */}
      <DelaySummaryBadges timeline={timeline} />

      {/* TABS */}
      <Tabs active={activeTab} setActive={setActiveTab} />

      {/* ================= OVERVIEW ================= */}
      {activeTab === "overview" && (
        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-700">
            This view mirrors the student dashboard with added CQI and
            supervisory oversight. Delay alerts are sent automatically.
          </p>
        </div>
      )}

      {/* ================= TIMELINE ================= */}
      {activeTab === "timeline" && (
        <div className="bg-white p-6 rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-purple-100">
              <tr>
                <th className="p-3 text-left">Activity</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Actual</th>
                <th className="p-3">Status</th>
                <th className="p-3">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((t, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">{t.activity}</td>
                  <td className="p-3">{t.expected || "-"}</td>
                  <td className="p-3">{t.actual || "-"}</td>
                  <td className={`p-3 font-semibold ${
                    t.status === "Late" ? "text-red-600" :
                    t.status === "Due Soon" ? "text-yellow-600" :
                    t.status === "Completed" ? "text-green-600" :
                    "text-blue-600"
                  }`}>
                    {t.status}
                  </td>
                  <td className="p-3">{t.remaining_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= DOCUMENTS ================= */}
      {activeTab === "documents" && (
        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-sm text-gray-500 italic">
            Document checklist is view-only for supervisors.
          </p>
        </div>
      )}

      {/* ================= CQI & PLO ================= */}
      {activeTab === "cqi" && (
        <div className="bg-white p-6 rounded-2xl shadow space-y-4">
          <h3 className="font-bold">🎯 CQI → PLO Attainment</h3>

          {Object.keys(cqi).length === 0 ? (
            <p className="text-gray-500 italic">No CQI data available.</p>
          ) : (
            Object.entries(cqi).map(([assessment, plos]) => (
              <div key={assessment}>
                <h4 className="font-semibold text-purple-700 mb-2">
                  {assessment}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(plos).map(([plo, d]) => (
                    <span
                      key={plo}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        d.status === "Achieved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {plo}: Avg {d.average} – {d.status}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
