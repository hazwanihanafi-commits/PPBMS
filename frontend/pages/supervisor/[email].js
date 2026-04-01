import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { API_BASE } from "../../utils/api";
import SupervisorChecklist from "../../components/SupervisorChecklist";
import SupervisorRemark from "../../components/SupervisorRemark";
import FinalPLOTable from "../../components/FinalPLOTable";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";

/* ================= GLASS CARD ================= */
const GlassCard = ({ children }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-white/40"
  >
    {children}
  </motion.div>
);

/* ================= RISK HELPERS ================= */
function getRiskColor(risk) {
  if (risk === "HIGH RISK") return "text-red-600";
  if (risk === "MODERATE RISK") return "text-amber-600";
  return "text-green-600";
}

function getRiskBg(risk) {
  if (risk === "HIGH RISK") return "bg-red-100";
  if (risk === "MODERATE RISK") return "bg-amber-100";
  return "bg-green-100";
}

/* ================= STATUS ================= */
function getStatusType(t) {
  if (t.status === "Late") return "late";
  if (t.status === "Due Soon") return "soon";
  if (t.status === "Completed") return "done";
  return "normal";
}

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
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    setStudent(data.row || null);
    setTimeline(data.row?.timeline || []);
    setCqi(data.row?.cqiByAssessment || {});
    setLoading(false);
  }

  if (loading) return <div className="p-6">Loading...</div>;
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

  const coSupervisorDisplay =
    Array.isArray(student.coSupervisors)
      ? student.coSupervisors.join(", ")
      : student.coSupervisors ||
        student.co_supervisor ||
        student.coSupervisor ||
        "-";

  /* ================= PDF ================= */
  function exportPDF() {
    const pdf = new jsPDF();
    let y = 20;

    pdf.setFontSize(16);
    pdf.text("UNIVERSITI SAINS MALAYSIA", 105, y, { align: "center" });

    y += 10;
    pdf.setFontSize(12);
    pdf.text("Postgraduate Progress Report", 105, y, { align: "center" });

    y += 10;
    pdf.text(`Name: ${student.student_name}`, 20, y);
    y += 7;
    pdf.text(`Programme: ${student.programme}`, 20, y);
    y += 7;

    // 🔴 Risk color
    pdf.text("Risk Level:", 20, y);
    pdf.setFont(undefined, "bold");

    if (riskScore === "HIGH RISK") {
      pdf.setTextColor(220, 38, 38);
    } else if (riskScore === "MODERATE RISK") {
      pdf.setTextColor(234, 179, 8);
    } else {
      pdf.setTextColor(22, 163, 74);
    }

    pdf.text(riskScore, 55, y);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, "normal");

    y += 10;

    pdf.text("Timeline:", 20, y);
    y += 6;

    timeline.forEach((t, i) => {
      pdf.text(`${i + 1}. ${t.activity} (${t.status})`, 20, y);
      y += 5;
    });

    pdf.save("report.pdf");
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#eef2ff] to-[#f1f5f9] flex">

      {/* SIDEBAR */}
      <div className="w-60 p-4">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 shadow-sm">

          <h2 className="font-semibold text-gray-800 mb-3">PPBMS</h2>

          {["overview","documents","timeline","cqi","remarks"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm
                ${
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
      <motion.div
        className="flex-1 p-6 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >

        {/* HEADER BUTTON */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={exportPDF}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl"
        >
          Export PDF
        </motion.button>

        {/* HERO */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-3xl p-6">

          <h1 className="text-xl font-semibold">
            {student.student_name}
          </h1>

          <p className="text-sm text-white/80">
            {student.programme}
          </p>

          <div className="mt-4 flex justify-between items-center">
            <span className="text-3xl">{progress}%</span>

            <span
              className={`text-xs px-3 py-1 rounded-full
                ${getRiskBg(riskScore)} ${getRiskColor(riskScore)}
              `}
            >
              {riskScore}
            </span>
          </div>

        </div>

        {/* CONTENT */}
        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">

              <GlassCard>
                <p><strong>Email:</strong> {student.email}</p>
                <p><strong>Co-Supervisor:</strong> {coSupervisorDisplay}</p>
              </GlassCard>

              <GlassCard>
                <p className={`font-semibold ${getRiskColor(riskScore)}`}>
                  {riskScore}
                </p>
              </GlassCard>

              {/* ANALYTICS CARDS */}
              <div className="grid grid-cols-3 gap-4">
                <GlassCard><p>Completed: {completed}</p></GlassCard>
                <GlassCard><p>Due Soon: {soon}</p></GlassCard>
                <GlassCard><p>Late: {late}</p></GlassCard>
              </div>

              {/* 📊 GRAPH (NOT REMOVED) */}
              <GlassCard>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: "Done", value: completed },
                    { name: "Soon", value: soon },
                    { name: "Late", value: late },
                  ]}>
                    <XAxis dataKey="name" />
                    <Tooltip />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>

            </div>
          )}

          {/* TIMELINE */}
          {activeTab === "timeline" && (
            <div className="space-y-3">
              {timeline.map((t, i) => {
                const type = getStatusType(t);

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 rounded-xl border
                      ${
                        type === "late"
                          ? "bg-red-50 border-red-300"
                          : type === "soon"
                          ? "bg-amber-50 border-amber-300"
                          : type === "done"
                          ? "bg-green-50 border-green-300"
                          : "bg-white"
                      }
                    `}
                  >
                    <p className="font-medium">{t.activity}</p>
                    <span className="text-xs">{t.status}</span>
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

          {/* REMARKS */}
          {activeTab === "remarks" && (
            <SupervisorRemark
              studentMatric={student.student_id}
              studentEmail={student.email}
            />
          )}

        </motion.div>

        {/* FOOTER */}
        <footer className="text-center text-xs text-gray-400 pt-6">
          © 2026 PPBMS · Universiti Sains Malaysia  
          <br />
          Developed by Hazwani Ahmad Yusof (2025)
        </footer>

      </motion.div>
    </div>
  );
}
