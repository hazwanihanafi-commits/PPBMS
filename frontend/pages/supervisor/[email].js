import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

import SupervisorChecklist from "../../components/SupervisorChecklist";
import SupervisorRemark from "../../components/SupervisorRemark";
import FinalPLOTable from "../../components/FinalPLOTable";
import TopBar from "../../components/TopBar";

/* ======================
   TABS
====================== */
function Tabs({ active, setActive }) {
  const Tab = ({ id, label }) => (
    <button
      onClick={() => setActive(id)}
      className={`px-4 py-2 rounded-xl font-semibold ${
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
export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  /* ======================
     AUTH
  ====================== */
  useEffect(() => {
    const role = localStorage.getItem("ppbms_role");
    if (role !== "supervisor") {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    const email = localStorage.getItem("ppbms_email");
    const role = localStorage.getItem("ppbms_role");
    if (email && role) setUser({ email, role });
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
        `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setStudent(data.row || null);
      setTimeline(data.row?.timeline || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  /* ======================
     RENDER
  ====================== */
  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  const cqiByAssessment = student.cqiByAssessment || {};
  const remarksByAssessment = student.remarksByAssessment || {};

  return (
    <>
      <TopBar user={user} />

      {/* BACK */}
      <div className="px-6 pt-4">
        <button
          onClick={() => router.push("/supervisor")}
          className="text-purple-600 text-sm font-semibold hover:underline"
        >
          ← Back to Supervisor Dashboard
        </button>
      </div>

      <div className="min-h-screen bg-purple-50 p-6 space-y-6">

        {/* ================= HEADER ================= */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h1 className="text-2xl font-bold mb-4">
            🎓 Student Progress (Supervisor View)
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><b>Name:</b> {student.student_name}</div>
            <div><b>Matric:</b> {student.student_id}</div>
            <div><b>Email:</b> {student.email}</div>
            <div><b>Programme:</b> {student.programme}</div>
            <div><b>Field:</b> {student.field}</div>
            <div><b>Department:</b> {student.department}</div>
            <div><b>Status:</b> {student.status}</div>
            <div>
              <b>Co-Supervisor(s):</b>{" "}
              {student.coSupervisors?.length
                ? student.coSupervisors.join(", ")
                : "None"}
            </div>
          </div>
        </div>

        {/* ================= TABS ================= */}
        <Tabs active={activeTab} setActive={setActiveTab} />

        {/* ================= OVERVIEW ================= */}
        {activeTab === "overview" && (
          <div className="bg-white p-6 rounded-2xl shadow">
            Supervisor monitoring view including timeline compliance,
            document verification, and CQI tracking.
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

            {/* CQI BY ASSESSMENT */}
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="font-bold mb-4">📊 CQI by Assessment</h3>

              {Object.keys(cqiByAssessment).length === 0 ? (
                <p className="text-sm italic text-gray-500">
                  No CQI data available for this student.
                </p>
              ) : (
                Object.entries(cqiByAssessment).map(
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
                            {plo}: Avg {d.average ?? "-"} – {d.status}
                          </span>
                        ))}
                      </div>

                      <SupervisorRemark
                        studentMatric={student.student_id}
                        studentEmail={student.email}
                        assessmentType={assessment}
                        initialRemark={remarksByAssessment[assessment]}
                      />
                    </div>
                  )
                )
              )}
            </div>

            {/* FINAL PLO */}
            <FinalPLOTable finalPLO={student.finalPLO} />
          </div>
        )}
      </div>
    </>
  );
}
