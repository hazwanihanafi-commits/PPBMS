import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { API_BASE } from "../../../utils/api";
import jsPDF from "jspdf";

import SupervisorChecklist from "../../../components/SupervisorChecklist";
import SupervisorRemark from "../../../components/SupervisorRemark";
import FinalPLOTable from "../../../components/FinalPLOTable";

/* ================= CARD ================= */
const GlassCard = ({ children }) => (
  <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm">
    {children}
  </div>
);

export default function AdminStudentPage() {

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

    const token =
      localStorage.getItem("ppbms_token");

    const decodedEmail =
      decodeURIComponent(email);

    const res = await fetch(
      `${API_BASE}/api/admin/student/${decodedEmail}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    console.log(decodedEmail);
    console.log(data);

    const row =
      data.row || data.student || data;

    if (!row || row.error) {
      console.error(row);
      setStudent(null);
      return;
    }

    setStudent(row);

    setTimeline(
      row?.timeline || []
    );

  } catch (err) {

    console.error(err);

  }

  setLoading(false);
}
  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        Student not found
      </div>
    );
  }

  /* ================= SAME LOGIC AS SUPERVISOR ================= */

  const completed =
    timeline.filter(
      t =>
        t.status === "Completed" ||
        t.status === "COMPLETED"
    ).length;

  const progress =
    timeline.length
      ? Math.round(
          (completed / timeline.length) * 100
        )
      : 0;

  const lateItems =
    timeline.filter(
      t =>
        t.status?.toLowerCase() === "late" ||

        t.status?.toUpperCase() === "AT_RISK" ||

        (!t.actual && t.remaining_days < 0)
    ).length;

  const nearDeadline =
    timeline.filter(
      t =>
        t.remaining_days > 0 &&
        t.remaining_days <= 30 &&
        t.status?.toLowerCase() !== "completed"
    ).length;

  const isGraduated =
    student.status?.toLowerCase() === "graduated" ||
    student.status?.toLowerCase() === "completed";

  function getCategory() {

    if (isGraduated) {
      return "Graduated";
    }

    if (progress >= 80) {
      return "On Track";
    }

    if (progress >= 50) {
      return "Slightly Late";
    }

    return "At Risk";
  }

  const category =
    getCategory();

  const coSupervisorDisplay =
    student.coSupervisors ||
    student.co_supervisor ||
    student.coSupervisor ||
    student.cosupervisor ||
    student.cosupervisors ||
    "-";

  /* ================= AI INSIGHT ================= */

  let aiMessage = "";

  if (isGraduated) {

    aiMessage =
      "🎓 Student has successfully completed the programme.";

  } else if (lateItems >= 3) {

    aiMessage =
      "⚠️ High delay risk. Immediate intervention required.";

  } else if (nearDeadline >= 2) {

    aiMessage =
      "⏳ Several milestones approaching deadline.";

  } else {

    aiMessage =
      "✅ Progress is stable and on track.";
  }

  /* ================= PDF ================= */

  function exportPDF() {

    const pdf = new jsPDF();

    let y = 20;

    pdf.text(
      "PPBMS Report",
      105,
      y,
      { align: "center" }
    );

    y += 10;

    pdf.text(
      `Name: ${student.student_name}`,
      20,
      y
    );

    y += 7;

    pdf.text(
      `Programme: ${student.programme}`,
      20,
      y
    );

    y += 7;

    pdf.text(
      `Category: ${category}`,
      20,
      y
    );

    pdf.save("report.pdf");
  }

  /* ================= UI ================= */

  return (

    <div className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#ede9fe] flex">

      {/* SIDEBAR */}
      <div className="w-56 p-4">

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 shadow">

          <h2 className="font-bold text-purple-700 mb-4">
            PPBMS ADMIN
          </h2>

          <button
            onClick={() => router.push("/admin")}
            className="mb-3 text-sm text-purple-600 hover:underline"
          >
            ← Back
          </button>

          {[
            "overview",
            "timeline",
            "documents",
            "cqi",
            "remarks"
          ].map(tab => (

            <button
              key={tab}
              onClick={() =>
                setActiveTab(tab)
              }
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 ${
                activeTab === tab
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.toUpperCase()}
            </button>

          ))}

        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">

          <h1 className="text-xl font-bold">
            Student Overview
          </h1>

          <button
            onClick={exportPDF}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl"
          >
            Export PDF
          </button>

        </div>

        {/* HERO */}
        <div className={`text-white rounded-3xl p-6 shadow-xl flex justify-between
          ${
            category === "Graduated"
              ? "bg-gradient-to-r from-blue-600 to-cyan-500"
              : category === "On Track"
              ? "bg-gradient-to-r from-green-600 to-emerald-500"
              : category === "Slightly Late"
              ? "bg-gradient-to-r from-yellow-500 to-amber-500"
              : "bg-gradient-to-r from-red-500 to-pink-500"
          }
        `}>

          <div>

            <h1 className="text-2xl font-semibold">
              {student.student_name}
            </h1>

            <p className="text-sm text-white/80">
              {student.programme}
            </p>

          </div>

          <div className="text-right">

            <p className="text-4xl font-bold">
              {progress}%
            </p>

            <span className={`px-4 py-1 rounded-full text-xs font-semibold mt-2 inline-block
              ${
                category === "Graduated"
                  ? "bg-blue-100 text-blue-700"
                  : category === "On Track"
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

        {/* INFO */}
        <GlassCard>

          <h3 className="font-semibold mb-3">
            Student Information
          </h3>

          <div className="grid grid-cols-2 gap-3 text-sm">

            <p>
              <b>Email:</b> {student.email}
            </p>

            <p>
              <b>Matric:</b> {student.student_id}
            </p>

            <p>
              <b>Status:</b> {student.status}
            </p>

            <p>
              <b>Supervisor:</b> {student.supervisor}
            </p>

            <p>
              <b>Co-Supervisor:</b> {coSupervisorDisplay}
            </p>

          </div>

        </GlassCard>

        {/* AI */}
        <div className="rounded-2xl p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border">

          <p className="text-xs text-indigo-500 uppercase font-semibold">
            AI Insight
          </p>

          <p className="text-sm mt-2">
            {aiMessage}
          </p>

        </div>

        {/* KPI */}
{!isGraduated ? (

  <div className="grid grid-cols-3 gap-4">

    <GlassCard>
      <p className="text-xs text-gray-500">
        Completed
      </p>

      <p className="text-3xl font-bold text-green-600">
        {completed}
      </p>
    </GlassCard>

    <GlassCard>
      <p className="text-xs text-gray-500">
        In Progress
      </p>

      <p className="text-3xl font-bold text-yellow-600">
        {timeline.length - completed}
      </p>
    </GlassCard>

    <GlassCard>
      <p className="text-xs text-gray-500">
        Late
      </p>

      <p className="text-3xl font-bold text-red-600">
        {lateItems}
      </p>
    </GlassCard>

  </div>

) : (

  <div className="bg-blue-50 rounded-2xl p-5 text-center shadow">
    🎓 Programme Completed Successfully
  </div>

)}

{/* TAB CONTENT */}
{activeTab === "timeline" && (
  <div className="space-y-4">

    {timeline.map((t, i) => {

      const isCompleted =
        t.status?.toLowerCase() === "completed";

      const isLate =
        t.remaining_days < 0;

      return (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-2xl shadow border-l-4
            ${
              isCompleted
                ? "bg-green-50 border-green-400"
                : isLate
                ? "bg-red-50 border-red-400"
                : "bg-white border-gray-300"
            }
          `}
        >

          <h3 className="font-semibold">
            {t.activity}
          </h3>

          <p className="text-sm text-gray-500">
            {t.expected} → {t.actual || "-"}
          </p>

          {!isCompleted && (
            <p className="text-sm mt-1 font-semibold">
              {t.remaining_days} days
            </p>
          )}

        </motion.div>
      );
    })}

  </div>
)}

{activeTab === "documents" && (
  <GlassCard>
    <SupervisorChecklist
      documents={student.documents}
    />
  </GlassCard>
)}

{activeTab === "cqi" && (
  <div className="space-y-6">

    <FinalPLOTable
      finalPLO={student.finalPLO}
    />

    {(student.remarksByAssessment || []).map((item, i) => {

      const showAlert =
        item.supervisorRemark &&
        !item.studentResponse;

      return (

        <GlassCard key={i}>

          <div className="flex justify-between mb-3">

            <div>

              <h3 className="font-semibold text-purple-700">
                {item.assessmentInstance}
              </h3>

              <p className="text-xs text-gray-400">
                {item.assessmentType}
              </p>

            </div>

            <span
              className={`text-xs px-3 py-1 rounded font-semibold ${
                item.status === "RESPONDED"
                  ? "bg-green-100 text-green-700"
                  : item.status === "PENDING"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {item.status || "PENDING"}
            </span>

          </div>

          <div className="mt-2">

            <p className="text-sm font-semibold">
              Supervisor Remark
            </p>

            <textarea
              className="w-full mt-1 p-2 border rounded-xl text-sm"
              rows={3}
              value={item.supervisorRemark || ""}
              readOnly
            />

          </div>

          <p className="text-sm mt-2">
            <b>Student:</b>{" "}
            {item.studentResponse || "—"}
          </p>

          {showAlert && (
            <div className="mt-3 bg-red-100 text-red-700 text-xs p-2 rounded-xl">
              ⚠ No student response yet
            </div>
          )}

        </GlassCard>

      );
    })}

  </div>
)}


      </div>

    </div>
  );
}

