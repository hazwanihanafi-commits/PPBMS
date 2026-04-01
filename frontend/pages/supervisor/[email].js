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

/* ================= STATUS ================= */
function getStatusType(t) {
  if (t.status === "Late") return "late";
  if (t.status === "Due Soon") return "soon";
  if (t.status === "Completed") return "done";
  return "normal";
}

/* ================= RISK COLOR ================= */
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

/* ================= MAIN ================= */

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
    pdf.text("Universiti Sains Malaysia", 105, y, { align: "center" });

    y += 8;
    pdf.setFontSize(14);
    pdf.text("Postgraduate Progress Report", 105, y, { align: "center" });

    y += 10;
    pdf.line(20, y, 190, y);

    y += 10;
    pdf.setFontSize(12);

    pdf.text(`Name: ${student.student_name}`, 20, y);
    y += 6;
    pdf.text(`Programme: ${student.programme}`, 20, y);
    y += 6;
    pdf.text(`Progress: ${progress}%`, 20, y);
    y += 6;

    /* 🔴 RISK COLOR */
    pdf.text("Risk Level:", 20, y);

    if (riskScore === "HIGH RISK") {
      pdf.setTextColor(220, 38, 38);
    } else if (riskScore === "MODERATE RISK") {
      pdf.setTextColor(234, 179, 8);
    } else {
      pdf.setTextColor(22, 163, 74);
    }

    pdf.setFont(undefined, "bold");
    pdf.text(riskScore, 55, y);

    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, "normal");

    y += 10;

    pdf.text("Timeline:", 20, y);
    y += 6;

    timeline.forEach((t, i) => {
      pdf.text(`${i + 1}. ${t.activity} - ${t.status}`, 20, y);
      y += 5;
    });

    pdf.save(`${student.student_name}_report.pdf`);
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2ff] flex">

      {/* SIDEBAR */}
      <div className="w-60 p-4">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 shadow-sm space-y-2">

          <h2 className="font-semibold">PPBMS</h2>

          {["overview","documents","timeline","cqi","remarks"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`block w-full text-left px-3 py-2 rounded-lg
                ${
                  activeTab === tab
                    ? "bg-purple-100 text-purple-700"
                    : "hover:bg-gray-100"
                }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}

        </div>
      </div>

      {/* MAIN */}
      <motion.div className="flex-1 p-6 space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        {/* HERO */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-3xl p-6">

          <h1>{student.student_name}</h1>

          <div className="flex justify-between mt-3">
            <span className="text-3xl">{progress}%</span>

            <span className={`px-3 py-1 rounded-full text-xs ${getRiskBg(riskScore)} ${getRiskColor(riskScore)}`}>
              {riskScore}
            </span>
          </div>

        </div>

        {/* BUTTON */}
        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl"
        >
          Export PDF
        </button>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4">

            <GlassCard>
              <p>Email: {student.email}</p>
              <p>Co-Supervisor: {coSupervisorDisplay}</p>
            </GlassCard>

            <GlassCard>
              <p className={getRiskColor(riskScore)}>
                {riskScore}
              </p>
            </GlassCard>

          </div>
        )}

        {/* TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-3">
            {timeline.map((t, i) => {
              const type = getStatusType(t);

              return (
                <div
                  key={i}
                  className={`p-4 rounded-xl border
                    ${
                      type === "late"
                        ? "bg-red-50 border-red-300"
                        : type === "soon"
                        ? "bg-amber-50 border-amber-300"
                        : type === "done"
                        ? "bg-green-50 border-green-300"
                        : "bg-white"
                    }`}
                >
                  <p>{t.activity}</p>
                  <span>{t.status}</span>
                </div>
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
    </div>
  );
}
