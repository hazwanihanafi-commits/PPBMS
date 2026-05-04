import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { API_BASE } from "../../utils/api";
import jsPDF from "jspdf";

import SupervisorChecklist from "../../components/SupervisorChecklist";
import FinalPLOTable from "../../components/FinalPLOTable";

export default function SupervisorStudentPage() {

  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

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
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();
      const studentData = data.row || data.student || data;

      setStudent(studentData || null);
      setTimeline(studentData?.timeline || []);

    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  /* ================= LOGIC ================= */

  const completed = timeline.filter(
    t => t.status === "Completed" || t.status === "COMPLETED"
  ).length;

  const lateItems = timeline.filter(
    t =>
      t.status?.toLowerCase() === "late" ||
      t.status?.toUpperCase() === "AT_RISK" ||
      (!t.actual && t.remaining_days < 0)
  ).length;

  const nearDeadline = timeline.filter(
    t =>
      t.remaining_days > 0 &&
      t.remaining_days <= 30 &&
      t.status?.toLowerCase() !== "completed"
  ).length;

  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  const isGraduated =
    student.status?.toLowerCase() === "graduated" ||
    student.status?.toLowerCase() === "completed";

  function getCategory() {
    if (isGraduated) return "Graduated";
    if (progress >= 80) return "On Track";
    if (progress >= 50) return "Slightly Late";
    return "At Risk";
  }

  const category = getCategory();

  /* ================= AI ================= */

  let aiMessage = "";

  if (isGraduated) {
    aiMessage =
      "🎓 Student has successfully completed the programme. No further monitoring required.";
  } else if (lateItems >= 3) {
    aiMessage =
      "⚠️ High probability of delay escalation. Immediate supervisor intervention required.";
  } else if (nearDeadline >= 2) {
    aiMessage =
      "⏳ Several milestones approaching deadline. Monitor closely.";
  } else {
    aiMessage =
      "✅ Student progress is stable and within expected trajectory.";
  }

  /* ================= PDF ================= */

  function exportPDF() {
    const pdf = new jsPDF();
    let y = 20;

    pdf.setFontSize(16);
    pdf.text("Postgraduate Progress Report", 105, y, { align: "center" });

    y += 10;
    pdf.text(`Name: ${student.student_name}`, 20, y); y += 7;
    pdf.text(`Programme: ${student.programme}`, 20, y); y += 7;
    pdf.text(`Category: ${category}`, 20, y); y += 10;

    timeline.forEach((t, i) => {
      pdf.text(`${i + 1}. ${t.activity} (${t.status})`, 20, y);
      y += 5;
    });

    pdf.save("report.pdf");
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#ede9fe] flex">

      {/* SIDEBAR */}
      <div className="w-56 p-4">
        <div className="bg-white rounded-2xl p-4 shadow">

          <h2 className="font-bold text-purple-700 mb-4">PPBMS</h2>

          <button
            onClick={() => router.push("/supervisor")}
            className="mb-3 text-sm text-purple-600"
          >
            ← Back
          </button>

          {["overview","timeline","documents","cqi"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm mb-1
                ${activeTab === tab
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100"}
              `}
            >
              {tab.toUpperCase()}
            </button>
          ))}

        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between">
          <h1 className="text-xl font-bold">Student Overview</h1>

          <button
            onClick={exportPDF}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl"
          >
            Export PDF
          </button>
        </div>

        {/* HERO */}
        <div className="bg-white rounded-3xl p-6 shadow border flex justify-between items-center">

          <div>
            <h2 className="text-lg font-bold">{student.student_name}</h2>
            <p className="text-sm text-gray-500">{student.programme}</p>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-purple-600">{progress}%</p>

            <span className={`px-3 py-1 rounded-full text-xs font-semibold
              ${
                category === "Graduated"
                  ? "bg-blue-100 text-blue-700"
                  : category === "On Track"
                  ? "bg-green-100 text-green-700"
                  : category === "Slightly Late"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}>
              {category}
            </span>
          </div>

        </div>

        {/* STUDENT INFO */}
        <div className="bg-white rounded-2xl p-5 shadow border">

          <h3 className="font-semibold mb-3">Student Information</h3>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <p><b>Email:</b> {student.email}</p>
            <p><b>Matric:</b> {student.student_id}</p>
            <p><b>Status:</b> {student.status}</p>
            <p><b>Supervisor:</b> {student.supervisor}</p>
          </div>

        </div>

        {/* AI */}
        <div className="bg-white rounded-2xl p-5 shadow border">
          <p className="text-xs text-gray-400">AI Insight</p>
          <p className="text-sm mt-2">{aiMessage}</p>
        </div>

        {/* KPI */}
        {!isGraduated ? (

          <div className="grid grid-cols-3 gap-4">

            <div className="bg-green-50 p-5 rounded-2xl text-center">
              <p>Completed</p>
              <p className="text-2xl font-bold text-green-700">{completed}</p>
            </div>

            <div className="bg-yellow-50 p-5 rounded-2xl text-center">
              <p>In Progress</p>
              <p className="text-2xl font-bold text-yellow-700">
                {timeline.length - completed}
              </p>
            </div>

            <div className="bg-red-50 p-5 rounded-2xl text-center">
              <p>Late</p>
              <p className="text-2xl font-bold text-red-700">{lateItems}</p>
            </div>

          </div>

        ) : (

          <div className="bg-blue-50 rounded-2xl p-5 text-center">
            🎓 Programme Completed Successfully
          </div>

        )}

        {/* TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-4">

            {timeline.map((t, i) => {

              const isCompleted = t.status?.toLowerCase() === "completed";
              const isLate = t.remaining_days < 0;

              return (
                <motion.div
                  key={i}
                  className={`p-5 rounded-2xl shadow border-l-4
                    ${
                      isCompleted
                        ? "bg-green-50 border-green-400"
                        : isLate
                        ? "bg-red-50 border-red-400"
                        : "bg-white border-gray-300"
                    }`}
                >

                  <h3 className="font-semibold">{t.activity}</h3>

                  <p className="text-sm text-gray-500">
                    Expected: {t.expected} | Actual: {t.actual || "-"}
                  </p>

                  {!isCompleted && (
                    <p className="text-sm mt-1">
                      {t.remaining_days} days
                    </p>
                  )}

                </motion.div>
              );
            })}

          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <SupervisorChecklist documents={student.documents || {}} />
        )}

        {/* CQI */}
        {activeTab === "cqi" && (
          <FinalPLOTable finalPLO={student.finalPLO} />
        )}

      </div>
    </div>
  );
}
