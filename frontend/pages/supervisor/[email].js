import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

import SupervisorChecklist from "../../components/SupervisorChecklist";
import SupervisorRemark from "../../components/SupervisorRemark";
import FinalPLOTable from "../../components/FinalPLOTable";
import TopBar from "../../components/TopBar";

/* ======================
   UI HELPERS
====================== */
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
      <Tab id="cqi" label="CQI / PLO" />
    </div>
  );
}

function DelayBadges({ timeline }) {
  const count = s => timeline.filter(t => t.status === s).length;

  const Badge = ({ label, value, color }) => (
    <div className={`rounded-xl p-4 ${color}`}>
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

/* ======================
   PAGE
====================== */
export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);


  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

   useEffect(() => {
  const role = localStorage.getItem("ppbms_role");
  if (role !== "supervisor") {
    window.location.href = "/login";
  }
}, []);


useEffect(() => {
  // ✅ user for TopBar
  const email = localStorage.getItem("ppbms_email");
  const role = localStorage.getItem("ppbms_role");

  if (email && role) {
    setUser({ email, role });
  }
}, []);


  async function loadStudent() {
    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setStudent(data.row || null);
      setTimeline(data.row?.timeline || []);
    } catch (err) {
      console.error("Load supervisor student error:", err);
    } finally {
      setLoading(false);
    }
  }


  const progress = timeline.length
    ? Math.round(
        (timeline.filter(t => t.status === "Completed").length /
          timeline.length) * 100
      )
    : 0;

   const cqiByAssessment = student?.cqiByAssessment || {};
const remarksByAssessment = student?.remarksByAssessment || {};

  return (
  <>
    <TopBar user={user} />

    {/* 🔙 BACK BUTTON */}
    <div className="px-6 pt-4">
      <button
        onClick={() => router.push("/supervisor")}
        className="text-sm font-semibold text-purple-600 hover:underline"
      >
        ← Back to Supervisor Dashboard
      </button>
    </div>

    {loading ? (
      <div className="p-6">Loading…</div>
    ) : !student ? (
      <div className="p-6">Student not found</div>
    ) : (
      <div className="min-h-screen bg-purple-50 p-6 space-y-6">

        {/* ================= HEADER ================= */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h1 className="text-2xl font-extrabold mb-2">
            🎓 Student Progress (Supervisor View)
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><strong>Name:</strong> {student.student_name}</div>
            <div><strong>Matric:</strong> {student.student_id}</div>
            <div><strong>Email:</strong> {student.email}</div>
            <div><strong>Programme:</strong> {student.programme}</div>
            <div><strong>Field:</strong> {student.field}</div>
            <div><strong>Department:</strong> {student.department}</div>
            <div><strong>Status:</strong> {student.status}</div>
            <div>
              <strong>Co-Supervisor(s):</strong>{" "}
              {student.cosupervisors || "None"}
            </div>
          </div>
        </div>

        {/* ================= TABS ================= */}
        <Tabs active={activeTab} setActive={setActiveTab} />

        {/* ================= OVERVIEW ================= */}
        {activeTab === "overview" && (
          <div className="bg-white p-6 rounded-2xl shadow">
            Supervisor overview and monitoring dashboard.
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
                </tr>
              </thead>
              <tbody>
                {timeline.map((t, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3">{t.activity}</td>
                    <td className="p-3">{t.expected || "-"}</td>
                    <td className="p-3">{t.actual || "-"}</td>
                    <td className="p-3">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= DOCUMENTS ================= */}
        {activeTab === "documents" && (
          <div className="bg-white p-6 rounded-2xl shadow">
            <SupervisorChecklist documents={student.documents} />
          </div>
        )}

{activeTab === "cqi" && (
  <div className="space-y-6">

    {/* CQI BY ASSESSMENT */}
    <div className="bg-white rounded-2xl p-6 shadow">
      <h3 className="font-bold mb-4">📊 CQI by Assessment</h3>

      {(!student.cqiByAssessment ||
        Object.keys(student.cqiByAssessment).length === 0) ? (
        <p className="text-sm italic text-gray-500">
          No CQI data available for this student.
        </p>
      ) : (
        Object.entries(student.cqiByAssessment).map(
          ([assessment, ploData]) => (
            <div key={assessment} className="mb-4">
              <h4 className="font-semibold text-purple-700">
                {assessment}
              </h4>

              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(ploData).map(([plo, d]) => (
                  <span
                    key={plo}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      d.status === "Achieved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {plo}: {d.status}
                  </span>
                ))}
              </div>
            </div>
          )
        )
      )}
    </div>

    {/* FINAL PLO */}
    <FinalPLOTable finalPLO={student.finalPLO} />
  </div>
)}

        
