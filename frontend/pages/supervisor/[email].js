import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { API_BASE } from "../../utils/api";
import jsPDF from "jspdf";

import SupervisorChecklist from "../../components/SupervisorChecklist";
import FinalPLOTable from "../../components/FinalPLOTable";

/* ================= PAGE ================= */

export default function SupervisorStudentPage() {

  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */

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

      const studentData =
        data.row || data.student || data;

      setStudent(studentData || null);
      setTimeline(studentData?.timeline || []);

    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  }

  /* ================= LOADING ================= */

  if (loading) return <div className="p-6">Loading...</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  /* ================= LOGIC (FROM DASHBOARD) ================= */

  const completed = timeline.filter(
    (t) =>
      t.status === "Completed" ||
      t.status === "COMPLETED"
  ).length;

  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  function getCategory() {

    if (progress >= 80) return "On Track";
    if (progress >= 50) return "Slightly Late";

    return "At Risk";
  }

  const category = getCategory();

  /* ================= AI PREDICTION ================= */

  const lateItems = timeline.filter(
    (t) => t.remaining_days < 0
  ).length;

  const nearDeadline = timeline.filter(
    (t) =>
      t.remaining_days >= 0 &&
      t.remaining_days <= 30
  ).length;

  let aiMessage = "";

  if (lateItems >= 3) {
    aiMessage =
      "⚠️ High probability of delay escalation. Immediate supervisor intervention recommended.";
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
        <div className="bg-white rounded-3xl p-6 shadow border flex justify-between">

          <div>
            <h2 className="text-lg font-bold">
              {student.student_name}
            </h2>
            <p className="text-sm text-gray-500">
              {student.programme}
            </p>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-purple-600">
              {progress}%
            </p>

            <span className={`px-3 py-1 rounded-full text-xs font-semibold
              ${
                category === "On Track"
                  ? "bg-green-100 text-green-700"
                  : category === "Slightly Late"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }
            `}>
              {category}
            </span>
          </div>

        </div>

        {/* AI INSIGHT */}
        <div className="bg-white rounded-2xl p-5 shadow border">
          <p className="text-xs text-gray-400 uppercase">AI Insight</p>
          <p className="text-sm mt-2 text-gray-700">{aiMessage}</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4">

          <div className="bg-green-50 rounded-2xl p-5 text-center shadow">
            <p className="text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-700">{completed}</p>
          </div>

          <div className="bg-yellow-50 rounded-2xl p-5 text-center shadow">
            <p className="text-sm">In Progress</p>
            <p className="text-2xl font-bold text-yellow-700">
              {timeline.length - completed}
            </p>
          </div>

          <div className="bg-red-50 rounded-2xl p-5 text-center shadow">
            <p className="text-sm">Late</p>
            <p className="text-2xl font-bold text-red-700">{lateItems}</p>
          </div>

        </div>

        {/* TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-4">

            {timeline.map((t, i) => {

              const status = t.status?.toLowerCase();

              const isCompleted = status === "completed";
              const isLate =
                status === "late" ||
                status === "at_risk" ||
                t.remaining_days < 0;

              const isSoon = status === "due soon";

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`
                    p-5 rounded-2xl shadow border-l-4
                    ${
                      isCompleted
                        ? "bg-green-50 border-green-400"
                        : isLate
                        ? "bg-red-50 border-red-400"
                        : isSoon
                        ? "bg-yellow-50 border-yellow-400"
                        : "bg-white border-gray-300"
                    }
                  `}
                >

                  <div className="flex justify-between">

                    <div>
                      <h3 className="font-semibold">{t.activity}</h3>
                      <p className="text-sm text-gray-500">
                        Expected: {t.expected} | Actual: {t.actual || "-"}
                      </p>
                    </div>

                    {!isCompleted && (
                      <div className="text-right">
                        <p className={`font-bold ${
                          t.remaining_days < 0
                            ? "text-red-600"
                            : t.remaining_days <= 30
                            ? "text-yellow-600"
                            : "text-purple-600"
                        }`}>
                          {t.remaining_days} days
                        </p>
                      </div>
                    )}

                  </div>

                  <p className="text-xs mt-2 font-semibold">
                    {t.status?.toUpperCase()}
                  </p>

                </motion.div>
              );
            })}

          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <SupervisorChecklist
            documents={student.documents || {}}
          />
        )}

        {/* CQI */}
        {activeTab === "cqi" && (
          <FinalPLOTable finalPLO={student.finalPLO} />
        )}

        {/* FOOTER */}
        <footer className="text-center text-xs text-gray-400 pt-6">
          © 2026 PPBMS · Universiti Sains Malaysia
        </footer>

      </div>
    </div>
  );
}
