import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import SupervisorChecklist from "../../components/SupervisorChecklist";
import SupervisorRemark from "../../components/SupervisorRemark";
import FinalPLOTable from "../../components/FinalPLOTable";

export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cqi, setCqi] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  /* =========================
     LOAD STUDENT DATA
  ========================== */
  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  async function loadStudent() {
    try {
      const token = localStorage.getItem("ppbms_token");

      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      setStudent(data.row || null);
      setTimeline(data.row?.timeline || []);
      setCqi(data.row?.cqiByAssessment || {});
    } catch (err) {
      console.error("Load student error:", err);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     PROGRESS CALCULATION
  ========================== */
  const progress = timeline.length
    ? Math.round(
        (timeline.filter((t) => t.status === "Completed").length /
          timeline.length) *
          100
      )
    : 0;

  if (loading) return <div className="p-6 text-center">Loading…</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-full text-sm font-semibold ${
        activeTab === id
          ? "bg-purple-600 text-white"
          : "bg-purple-100 text-purple-700 hover:bg-purple-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-6">

      {/* 🔙 BACK BUTTON */}
      <button
        onClick={() => router.push("/supervisor")}
        className="text-sm font-semibold text-purple-700 hover:underline"
      >
        ← Back to Supervisor Dashboard
      </button>

      {/* 🧭 TABS */}
      <div className="flex flex-wrap gap-2">
        <TabButton id="overview" label="📊 Overview" />
        <TabButton id="documents" label="📁 Documents" />
        <TabButton id="timeline" label="🗓 Timeline" />
        <TabButton id="cqi" label="🎯 CQI & PLO" />
        <TabButton id="remarks" label="📝 Supervisor Remarks" />
      </div>

      {/* =========================
          OVERVIEW TAB
      ========================== */}
      {activeTab === "overview" && (
        <div className="bg-white rounded-2xl p-6 shadow space-y-3">
          <h2 className="text-xl font-bold">{student.student_name}</h2>
          <p><strong>Matric:</strong> {student.student_id}</p>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Programme:</strong> {student.programme}</p>
          <p><strong>Field:</strong> {student.field}</p>
          <p><strong>Department:</strong> {student.department}</p>
          <p><strong>Status:</strong> {student.status}</p>

          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-semibold text-purple-700">
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
      )}

      {/* =========================
          DOCUMENTS TAB
      ========================== */}
      {activeTab === "documents" && (
        <SupervisorChecklist documents={student.documents || {}} />
      )}

      {/* =========================
          TIMELINE TAB
      ========================== */}
      {activeTab === "timeline" && (
        <div className="bg-white rounded-2xl p-6 shadow">
          <h3 className="font-bold mb-4">📅 Expected vs Actual Timeline</h3>
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
                  <td className="p-3">{t.status}</td>
                  <td className="p-3">{t.remaining_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================
          CQI & PLO TAB
      ========================== */}
      {activeTab === "cqi" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow">
            <h3 className="font-bold mb-3">🎯 CQI by Assessment</h3>

            {Object.entries(cqi || {}).map(([assessment, ploData]) => (
              <div key={assessment} className="mb-4">
                <h4 className="font-semibold text-purple-700 mb-2">
                  {assessment}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ploData || {}).map(([plo, d]) => (
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
            ))}
          </div>

          <FinalPLOTable finalPLO={student.finalPLO} />
        </div>
      )}

      {/* =========================
          REMARKS TAB
      ========================== */}
      {activeTab === "remarks" && (
        <div className="space-y-4">
          <SupervisorRemark
            studentMatric={student.student_id}
            studentEmail={student.email}
            assessmentType="TRX500"
            initialRemark={student.remarksByAssessment?.TRX500}
          />
          <SupervisorRemark
            studentMatric={student.student_id}
            studentEmail={student.email}
            assessmentType="VIVA"
            initialRemark={student.remarksByAssessment?.VIVA}
          />
        </div>
      )}
    </div>
  );
}
