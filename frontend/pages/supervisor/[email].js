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
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  async function loadStudent() {
    const token = localStorage.getItem("ppbms_token");
    const res = await fetch(
      `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();

    setStudent(data.row);
    setTimeline(data.row?.timeline || []);
    setCqi(data.row?.cqiByAssessment || {});
    setLoading(false);
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  const completed = timeline.filter(t => t.status === "Completed").length;
  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  const nextMilestone = timeline.find(t => t.status !== "Completed");

  const hasCQIAlert =
    timeline.some(t => t.status === "Late" || t.status === "Due Soon") ||
    Object.values(cqi).some(a =>
      Object.values(a).some(p => p.status !== "Achieved")
    );

  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-6">

      {/* BACK */}
      <button
        onClick={() => router.push("/supervisor")}
        className="text-purple-700 font-medium hover:underline"
      >
        ← Back to Supervisor Dashboard
      </button>

      {/* ================= HERO (STUDENT-STYLE) ================= */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold">{student.student_name}</h1>
        <p className="text-purple-100">
          {student.programme} · {student.department}
        </p>

        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm">Overall Progress</p>
            <p className="text-3xl font-extrabold">{progress}%</p>
          </div>

          {nextMilestone && (
            <div className="bg-white text-gray-800 rounded-xl p-4 shadow">
              <p className="text-xs uppercase text-gray-500 font-semibold">
                Next Milestone
              </p>
              <p className="font-bold">{nextMilestone.activity}</p>
              <p className="text-sm">
                Due in {nextMilestone.remaining_days} days
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 bg-purple-300/30 h-3 rounded-full">
          <div
            className="bg-white h-3 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ================= CQI ALERT ================= */}
      {hasCQIAlert && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
          <p className="font-bold text-red-700">🚨 CQI Attention Required</p>
          <p className="text-sm text-red-600">
            One or more milestones or PLOs require intervention.
          </p>
        </div>
      )}

      {/* ================= TABS ================= */}
      <div className="flex gap-2 flex-wrap">
        {[
          ["overview", "📊 Overview"],
          ["documents", "📁 Documents"],
          ["timeline", "📅 Timeline"],
          ["cqi", "🎯 CQI & PLO"],
          ["remarks", "📝 Supervisor Remarks"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-full font-semibold ${
              activeTab === id
                ? "bg-purple-600 text-white"
                : "bg-purple-100 text-purple-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ================= TAB CONTENT ================= */}

      {activeTab === "overview" && (
        <div className="bg-white rounded-2xl shadow p-6 text-sm space-y-2">
          <p><strong>Matric:</strong> {student.student_id}</p>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Status:</strong> {student.status}</p>
          <p><strong>Main Supervisor:</strong> {student.supervisor}</p>
        </div>
      )}

      {activeTab === "documents" && (
        <SupervisorChecklist documents={student.documents || {}} />
      )}

      {activeTab === "timeline" && (
        <div className="bg-white rounded-2xl shadow p-6">
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
                  <td className="p-3">{t.expected}</td>
                  <td className="p-3">{t.actual || "-"}</td>
                  <td className="p-3">{t.status}</td>
                  <td className="p-3">{t.remaining_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "cqi" && (
        <FinalPLOTable finalPLO={student.finalPLO} />
      )}

      {activeTab === "remarks" && (
        <SupervisorRemark
          studentMatric={student.student_id}
          studentEmail={student.email}
          assessmentType="TRX500"
          initialRemark={student.remarksByAssessment?.TRX500}
        />
      )}
    </div>
  );
}
