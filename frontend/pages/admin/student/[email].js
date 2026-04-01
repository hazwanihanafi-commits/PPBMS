import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
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

/* ================= PAGE ================= */
export default function AdminStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cqi, setCqi] = useState({});
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */
  useEffect(() => {
    if (!router.isReady || !email) return;
    loadStudent();
  }, [router.isReady, email]);

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
  const late = timeline.filter(t => t.status === "Late").length;
  const soon = timeline.filter(t => t.status === "Due Soon").length;

  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  const riskScore =
    late > 2
      ? "HIGH RISK"
      : late > 0 || soon > 2
      ? "MODERATE RISK"
      : "LOW RISK";

  const coSupervisorDisplay = Array.isArray(student.coSupervisors)
    ? student.coSupervisors.join(", ")
    : student.coSupervisors || "-";

  /* ================= EXPORT PDF ================= */
  function exportPDF() {
    const pdf = new jsPDF();
    let y = 15;

    pdf.setFontSize(16);
    pdf.text("UNIVERSITI SAINS MALAYSIA", 105, y, { align: "center" });

    y += 8;
    pdf.setFontSize(12);
    pdf.text("Postgraduate Student Progress Report", 105, y, { align: "center" });

    y += 12;

    /* STUDENT INFO */
    pdf.text(`Name: ${student.student_name}`, 10, y); y += 6;
    pdf.text(`Matric: ${student.student_id}`, 10, y); y += 6;
    pdf.text(`Programme: ${student.programme}`, 10, y); y += 6;
    pdf.text(`Supervisor: ${student.supervisor}`, 10, y); y += 6;
    pdf.text(`Co-Supervisors: ${coSupervisorDisplay}`, 10, y); y += 6;

    /* RISK */
    pdf.setFont(undefined, "bold");
    pdf.text(`Risk Level: ${riskScore}`, 10, y);
    pdf.setFont(undefined, "normal");
    y += 10;

    /* TIMELINE */
    pdf.text("Timeline:", 10, y); y += 6;

    timeline.forEach((t, i) => {
      pdf.text(
        `${i + 1}. ${t.activity} (${t.status})`,
        10,
        y
      );
      y += 5;

      if (y > 270) {
        pdf.addPage();
        y = 10;
      }
    });

    /* CQI */
    y += 5;
    pdf.text("PLO Achievement:", 10, y); y += 6;

    Object.entries(student.finalPLO || {}).forEach(([plo, v]) => {
      pdf.text(`${plo}: ${v.average ?? "-"} (${v.status})`, 10, y);
      y += 5;
    });

    /* REMARKS */
    y += 5;
    pdf.text("Supervisor Remarks:", 10, y); y += 6;

    Object.values(student.remarksByAssessment || {}).forEach(r => {
      pdf.text(`- ${r}`, 10, y);
      y += 5;
    });

    pdf.save(`${student.student_name}_report.pdf`);
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-red-50 p-6 space-y-6">

      {/* BACK */}
      <button
        onClick={() => router.push("/admin")}
        className="text-red-600 font-medium hover:underline"
      >
        ← Back to Admin Dashboard
      </button>

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">{student.student_name}</h1>

        <button
          onClick={exportPDF}
          className="bg-red-600 text-white px-4 py-2 rounded-xl"
        >
          Export Full Report
        </button>
      </div>

      {/* HERO */}
      <div className="bg-red-600 text-white rounded-2xl p-6">
        <p>{student.programme}</p>
        <p className="text-3xl font-bold">{progress}%</p>
        <p className="text-sm">{riskScore}</p>
      </div>

      {/* OVERVIEW */}
      <GlassCard>
        <p><strong>Email:</strong> {student.email}</p>
        <p><strong>Co-supervisors:</strong> {coSupervisorDisplay}</p>
      </GlassCard>

      {/* TIMELINE */}
      <div className="space-y-3">
        {timeline.map((t, i) => (
          <div
            key={i}
            className={`p-3 rounded border ${
              t.status === "Late"
                ? "bg-red-100"
                : t.status === "Due Soon"
                ? "bg-orange-100"
                : "bg-green-100"
            }`}
          >
            <p>{t.activity}</p>
            <p className="text-xs">{t.status}</p>
          </div>
        ))}
      </div>

      {/* CQI */}
      <FinalPLOTable finalPLO={student.finalPLO} />

      {/* REMARKS */}
      {Object.entries(student.remarksByAssessment || {}).map(
        ([type, remark]) => (
          <SupervisorRemark
            key={type}
            studentMatric={student.student_id}
            studentEmail={student.email}
            assessmentType={type}
            initialRemark={remark}
            isAdmin
          />
        )
      )}

      <footer className="text-center text-xs text-gray-400 pt-6">
        © 2026 PPBMS · USM
      </footer>

    </div>
  );
}
