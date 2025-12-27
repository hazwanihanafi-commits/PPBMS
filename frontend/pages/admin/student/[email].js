import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { API_BASE } from "../../../utils/api";

import SupervisorChecklist from "../../../components/SupervisorChecklist";
import SupervisorRemark from "../../../components/SupervisorRemark";
import FinalPLOTable from "../../../components/FinalPLOTable";
import TopBar from "../../../components/TopBar";

/* ======================
   TABS UI
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
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  /* ======================
     ADMIN AUTH GUARD
  ====================== */
  useEffect(() => {
    const role = localStorage.getItem("ppbms_role");
    if (role !== "admin") {
      window.location.href = "/login";
    }
  }, []);

  /* ======================
     TOPBAR USER
  ====================== */
  useEffect(() => {
    const email = localStorage.getItem("ppbms_email");
    const role = localStorage.getItem("ppbms_role");
    if (email && role) {
      setUser({ email, role });
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
      const res = await fetch(
        `${API_BASE}/api/admin/student/${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("ADMIN STUDENT API ERROR:", res.status, text);
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setStudent(data.row || null);
    } catch (e) {
      console.error("Admin load student error:", e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ======================
     UI STATES
  ====================== */
  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  if (!student) {
    return <div className="p-6">Student not found</div>;
  }

  const timeline = student.timeline || [];
  const completed = timeline.filter(t => t.status === "Completed").length;
  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  /* ======================
     RENDER
  ====================== */
  return (
    <>
      <TopBar user={user} />

      <div className="min-h-screen bg-purple-50 p-6 space-y-6">

        {/* BACK */}
        <button
          onClick={() => router.push("/admin")}
          className="text-purple-700 underline"
        >
          ← Back to Admin Dashboard
        </button>

        {/* ================= HEADER ================= */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h1 className="text-2xl font-extrabold mb-2">
            🎓 Student Profile (Admin View)
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><strong>Name:</strong> {student.student_name}</div>
            <div><strong>Matric:</strong> {student.matric}</div>
            <div><strong>Email:</strong> {student.email}</div>
            <div><strong>Programme:</strong> {student.programme}</div>
            <div><strong>Field:</strong> {student.field || "-"}</div>
            <div><strong>Department:</strong> {student.department || "-"}</div>
            <div>
              <strong>Status:</strong>{" "}
              <span
                className={`px-2 py-1 rounded text-xs ${
                  student.status === "Graduated"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {student.status}
              </span>
            </div>
            <div>
              <strong>Main Supervisor:</strong>{" "}
              {student.supervisor || "-"}
            </div>
            {student.coSupervisors && (
              <div>
                <strong>Co-Supervisor(s):</strong>{" "}
                {student.coSupervisors}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Progress</span>
              <span className="font-semibold text-purple-700">
                {progress}%
              </span>
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
            Administrative view for monitoring student progress, CQI outcomes,
            and compliance with postgraduate milestones.
          </div>
        )}

        {/* ================= DOCUMENTS ================= */}
        {activeTab === "documents" && (
          <div className="bg-white p-6 rounded-2xl shadow">
            <SupervisorChecklist documents={student.documents || {}} />
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
                {timeline.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-3 text-center italic">
                      No timeline data available
                    </td>
                  </tr>
                ) : (
                  timeline.map((t, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3">{t.activity}</td>
                      <td className="p-3">{t.expected || "-"}</td>
                      <td className="p-3">{t.actual || "-"}</td>
                      <td className="p-3 font-semibold">{t.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= CQI / PLO ================= */}
        {activeTab === "cqi" && (
          <div className="space-y-6">

            {/* CQI BY ASSESSMENT */}
            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="font-bold mb-4">📊 CQI by Assessment</h3>

              {Object.keys(student.cqiByAssessment || {}).length === 0 ? (
                <p className="text-sm italic text-gray-500">
                  No CQI data available.
                </p>
              ) : (
                Object.entries(student.cqiByAssessment).map(
                  ([assessment, ploData]) => (
                    <div key={assessment} className="mb-6">
                      <h4 className="font-semibold text-purple-700 mb-2">
                        {assessment}
                      </h4>

                      <div className="flex flex-wrap gap-2">
                        {Object.entries(ploData).map(([plo, d]) => (
                          <span
                            key={plo}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              d.status === "Achieved"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {plo}: Avg {d.average ?? "-"} – {d.status}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                )
              )}
            </div>

            {/* SUPERVISOR REMARKS */}
            {Object.keys(student.cqiByAssessment || {}).map(type => (
              <SupervisorRemark
                key={type}
                studentMatric={student.matric}
                studentEmail={student.email}
                assessmentType={type}
                initialRemark={student.remarksByAssessment?.[type]}
              />
            ))}

            {/* FINAL PLO */}
            <FinalPLOTable finalPLO={student.finalPLO} />

          </div>
        )}

      </div>
    </>
  );
}
