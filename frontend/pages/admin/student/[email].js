import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "@/utils/api";

import SupervisorChecklist from "@/components/SupervisorChecklist";
import FinalPLOTable from "@/components/FinalPLOTable";

/* ======================
   TABS
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

/* ======================
   PAGE
====================== */
export default function AdminStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  /* ======================
     AUTH GUARD
  ====================== */
  useEffect(() => {
    const role = localStorage.getItem("ppbms_role");
    if (role !== "admin") {
      window.location.href = "/login";
    }
  }, []);

  /* ======================
     LOAD STUDENT
  ====================== */
  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  async function loadStudent() {
    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(
        `${API_BASE}/api/admin/student/${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("HTTP " + res.status);

      const data = await res.json();
      setStudent(data.row || null);
      setTimeline(data.row?.timeline || []);
    } catch (err) {
      console.error("Admin load student error:", err);
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }

  /* ======================
     PROGRESS
  ====================== */
  const progress = timeline.length
    ? Math.round(
        (timeline.filter(t => t.status === "Completed").length /
          timeline.length) * 100
      )
    : 0;

  /* ======================
     RENDER
  ====================== */
  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  if (!student) {
    return <div className="p-6">Student not found</div>;
  }

  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-6">

      {/* ================= HEADER ================= */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-extrabold mb-2">
          🎓 Student Profile (Admin View)
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div><strong>Name:</strong> {student.student_name}</div>
          <div><strong>Matric:</strong> {student.student_id}</div>
          <div><strong>Email:</strong> {student.email}</div>
          <div><strong>Programme:</strong> {student.programme}</div>
          <div><strong>Field:</strong> {student.field}</div>
          <div><strong>Department:</strong> {student.department}</div>
          <div>
            <strong>Status:</strong>{" "}
            <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">
              {student.status}
            </span>
          </div>
          <div>
            <strong>Main Supervisor:</strong> {student.supervisor}
          </div>
        </div>

        {/* Progress Bar */}
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

      {/* ================= TABS ================= */}
      <Tabs active={activeTab} setActive={setActiveTab} />

      {/* ================= OVERVIEW ================= */}
      {activeTab === "overview" && (
        <div className="bg-white p-6 rounded-2xl shadow text-gray-700">
          This page provides an administrative overview of postgraduate
          progression, documentation completeness, and final PLO attainment
          aligned with MQA requirements.
        </div>
      )}

      {/* ================= TIMELINE ================= */}
      {activeTab === "timeline" && (
        <div className="bg-white p-6 rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-purple-100 text-purple-700">
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
                  <td className="p-3 font-semibold">{t.status}</td>
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

      {/* ================= CQI / PLO ================= */}
      {activeTab === "cqi" && (
        <div className="space-y-6">

          {Object.keys(student.cqiByAssessment || {}).length === 0 ? (
            <div className="bg-white p-6 rounded-2xl shadow text-sm text-gray-500 italic">
              CQI by assessment is not applicable for graduated students.
              Final PLO attainment is shown below.
            </div>
          ) : null}

          <FinalPLOTable finalPLO={student.finalPLO} />

        </div>
      )}
    </div>
  );
}
