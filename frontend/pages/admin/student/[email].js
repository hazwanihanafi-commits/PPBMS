import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../../utils/api";

import SupervisorChecklist from "../../../components/SupervisorChecklist";
import SupervisorRemark from "../../../components/SupervisorRemark";
import FinalPLOTable from "../../../components/FinalPLOTable";

export default function AdminStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cqi, setCqi] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const isAdmin = true; // 🔥 explicit admin authority

  /* ================= LOAD STUDENT ================= */
  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  async function loadStudent() {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("ppbms_token")
          : "";

      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
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

  /* ================= GUARDS ================= */
  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  /* ================= NORMALISATION ================= */
  const completed = timeline.filter(t => t.status === "Completed").length;
  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  const hasCQIAlert =
    student.status !== "Graduated" &&
    (
      timeline.some(t => t.status === "Late" || t.status === "Due Soon") ||
      Object.values(cqi || {}).some(a =>
        a && typeof a === "object"
          ? Object.values(a).some(p => p?.status !== "Achieved")
          : false
      )
    );

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-red-50 p-6 space-y-6">

      {/* BACK */}
      <button
        onClick={() => router.push("/admin")}
        className="text-red-700 font-medium hover:underline"
      >
        ← Back to Admin Dashboard
      </button>

      {/* ================= HERO ================= */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl shadow p-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{student.student_name}</h1>
          <span className="px-3 py-1 rounded-full text-xs bg-white/20">
            {student.status}
          </span>
          <span className="px-3 py-1 rounded-full text-xs bg-black/30">
            ADMIN VIEW
          </span>
        </div>

        <p className="text-red-100">
          {student.programme} · {student.department}
        </p>

        <div className="mt-4">
          <p className="text-sm">Overall Progress</p>
          <p className="text-3xl font-extrabold">{progress}%</p>
        </div>
      </div>

      {/* ================= CQI ALERT ================= */}
      {hasCQIAlert && (
        <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded-xl">
          <p className="font-bold text-red-800">
            🚨 CQI Intervention Required (Admin)
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
          ["remarks", "🛡 Admin Remarks & Override"]
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-full font-semibold ${
              activeTab === id
                ? "bg-red-600 text-white"
                : "bg-red-100 text-red-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ================= OVERVIEW ================= */}
      {activeTab === "overview" && (
        <div className="bg-white rounded-2xl shadow p-6 text-sm">
          <p><strong>Matric:</strong> {student.student_id}</p>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Status:</strong> {student.status}</p>
        </div>
      )}

      {/* ================= DOCUMENTS ================= */}
      {activeTab === "documents" && (
        <SupervisorChecklist documents={student.documents || {}} />
      )}

      {/* ================= TIMELINE ================= */}
      {activeTab === "timeline" && (
        <SupervisorChecklist documents={student.documents || {}} />
      )}

      {/* ================= CQI & PLO ================= */}
      {activeTab === "cqi" && (
        <FinalPLOTable finalPLO={student.finalPLO} />
      )}

      {/* ================= ADMIN REMARKS ================= */}
      {activeTab === "remarks" && (
        <div className="space-y-6">
          {Object.entries(student.remarksByAssessment || {}).map(
            ([assessmentType, remark]) => (
              <SupervisorRemark
                key={assessmentType}
                studentMatric={student.student_id}
                studentEmail={student.email}
                assessmentType={assessmentType}
                initialRemark={remark}
                isAdmin={isAdmin} // 🔥 ADMIN POWER
              />
            )
          )}
        </div>
      )}

    </div>
  );
}
