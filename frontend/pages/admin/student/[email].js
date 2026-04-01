import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { API_BASE } from "../../../utils/api";

import SupervisorChecklist from "../../../components/SupervisorChecklist";
import SupervisorRemark from "../../../components/SupervisorRemark";
import FinalPLOTable from "../../../components/FinalPLOTable";

/* ================= GLASS CARD ================= */
const GlassCard = ({ children }) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-white/40"
  >
    {children}
  </motion.div>
);

export default function AdminStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cqi, setCqi] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const isAdmin = true;

  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  async function loadStudent() {
    const token = localStorage.getItem("ppbms_token");

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
    setLoading(false);
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  /* ================= DATA ================= */
  const completed = timeline.filter(t => t.status === "Completed").length;
  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  const hasCQIAlert =
    student.status !== "Graduated" &&
    (
      timeline.some(t => t.status === "Late" || t.status === "Due Soon") ||
      Object.values(cqi || {}).some(a =>
        Object.values(a || {}).some(p => p?.status !== "Achieved")
      )
    );

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 p-6 space-y-6">

      {/* BACK */}
      <button
        onClick={() => router.push("/admin")}
        className="text-red-600 font-medium hover:underline"
      >
        ← Back to Admin Dashboard
      </button>

      {/* HERO */}
      <div className="bg-gradient-to-br from-red-600 to-rose-500 text-white rounded-3xl p-6 shadow-lg">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">
              {student.student_name}
            </h1>
            <p className="text-sm text-white/80">
              {student.programme}
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs bg-black/30">
            ADMIN VIEW
          </span>
        </div>

        <div className="mt-5">
          <p className="text-sm">Overall Progress</p>
          <p className="text-3xl font-bold">{progress}%</p>

          <div className="mt-2 h-2 bg-white/30 rounded-full">
            <div
              className="h-2 bg-white rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

      </div>

      {/* ALERT */}
      {hasCQIAlert && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-xl">
          <p className="font-semibold text-red-700">
            🚨 CQI Intervention Required
          </p>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">
        {["overview","documents","timeline","cqi","remarks"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition
              ${
                activeTab === tab
                  ? "bg-red-600 text-white shadow"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-2 gap-4">

            <GlassCard>
              <p><strong>Email:</strong> {student.email}</p>
              <p><strong>Matric:</strong> {student.student_id}</p>
              <p><strong>Status:</strong> {student.status}</p>
            </GlassCard>

            <GlassCard>
              <p><strong>Programme:</strong> {student.programme}</p>
              <p><strong>Department:</strong> {student.department}</p>
              <p><strong>Field:</strong> {student.field || "-"}</p>
            </GlassCard>

            <GlassCard>
              <p><strong>Main Supervisor:</strong> {student.supervisor || "-"}</p>
              <p><strong>Co-supervisors:</strong> {student.cosupervisors || "-"}</p>
            </GlassCard>

          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <SupervisorChecklist documents={student.documents || {}} />
        )}

        {/* 🔥 TIMELINE (CARD VERSION) */}
        {activeTab === "timeline" && (
          <div className="space-y-3">

            {timeline.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border
                  ${
                    t.status === "Late"
                      ? "bg-red-50 border-red-300"
                      : t.status === "Due Soon"
                      ? "bg-orange-50 border-orange-300"
                      : t.status === "Completed"
                      ? "bg-green-50 border-green-300"
                      : "bg-white"
                  }
                `}
              >
                <div className="flex justify-between">

                  <div>
                    <p className="font-semibold">{t.activity}</p>
                    <p className="text-xs text-gray-500">
                      {t.expected} → {t.actual || "-"}
                    </p>
                  </div>

                  <span className="text-xs font-semibold">
                    {t.status}
                  </span>

                </div>
              </motion.div>
            ))}

          </div>
        )}

        {/* CQI */}
        {activeTab === "cqi" && (
          <FinalPLOTable finalPLO={student.finalPLO} />
        )}

        {/* REMARKS */}
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
                  isAdmin={isAdmin}
                />
              )
            )}
          </div>
        )}

      </motion.div>

      {/* FOOTER */}
      <footer className="text-center text-xs text-gray-400 pt-6">
        © 2026 PPBMS · Universiti Sains Malaysia  
        <br />
        Admin Panel · Developed by Hazwani Ahmad Yusof
      </footer>

    </div>
  );
}
