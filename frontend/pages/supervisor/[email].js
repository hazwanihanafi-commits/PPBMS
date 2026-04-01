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
    whileHover={{ y: -3 }}
    className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-white/40"
  >
    {children}
  </motion.div>
);

/* ================= RISK ================= */
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
    student.coSupervisors ||
    student.co_supervisor ||
    student.cosupervisor ||
    "-";

  /* ================= PDF ================= */
  function exportPDF() {
    const pdf = new jsPDF();
    let y = 20;

    pdf.text("Postgraduate Progress Report", 105, y, { align: "center" });
    y += 10;

    pdf.text(`Name: ${student.student_name}`, 20, y);
    y += 6;
    pdf.text(`Programme: ${student.programme}`, 20, y);
    y += 6;

    pdf.text("Risk:", 20, y);

    if (riskScore === "HIGH RISK") pdf.setTextColor(220, 38, 38);
    else if (riskScore === "MODERATE RISK") pdf.setTextColor(234, 179, 8);
    else pdf.setTextColor(22, 163, 74);

    pdf.text(riskScore, 40, y);
    pdf.setTextColor(0, 0, 0);

    y += 10;

    timeline.forEach((t, i) => {
      pdf.text(
        `${i + 1}. ${t.activity} (${t.status})`,
        20,
        y
      );
      y += 5;
    });

    pdf.save("report.pdf");
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#eef2ff] to-[#f1f5f9] flex flex-col md:flex-row">

      {/* SIDEBAR */}
      <div className="md:w-56 w-full md:p-4 p-2">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-3 shadow-sm flex md:flex-col gap-2 overflow-x-auto">

          {["overview","documents","timeline","cqi","remarks"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap
                ${
                  activeTab === tab
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}

        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-4 md:p-6 space-y-6">

        {/* EXPORT */}
        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl"
        >
          Export PDF
        </button>

        {/* HERO */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-3xl p-6 shadow">
          <h1 className="text-lg md:text-xl font-bold">
            {student.student_name}
          </h1>
          <p className="text-sm opacity-80">{student.programme}</p>

          <div className="mt-4 flex justify-between items-center">
            <span className="text-3xl font-bold">{progress}%</span>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold
              ${getRiskBg(riskScore)} ${getRiskColor(riskScore)}`}
            >
              {riskScore}
            </span>
          </div>
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4">

            <GlassCard>
              <p><strong>Email:</strong> {student.email}</p>
              <p><strong>Co-Supervisor:</strong> {coSupervisorDisplay}</p>
            </GlassCard>

            {/* ANALYTICS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <GlassCard>
                <p className="text-xs">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completed}</p>
              </GlassCard>

              <GlassCard>
                <p className="text-xs">Due Soon</p>
                <p className="text-2xl font-bold text-amber-600">{soon}</p>
              </GlassCard>

              <GlassCard>
                <p className="text-xs">Late</p>
                <p className="text-2xl font-bold text-red-600">{late}</p>
              </GlassCard>

            </div>

            {/* GRAPH */}
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
                <div
                  key={i}
                  className={`p-4 rounded-xl border flex justify-between items-center
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
                  <div>
                    <p className="font-medium">{t.activity}</p>
                    <p className="text-xs">{t.status}</p>
                  </div>

                  <div className="text-sm font-semibold">
                    {t.remaining_days < 0
                      ? `${Math.abs(t.remaining_days)} days overdue`
                      : `${t.remaining_days} days`}
                  </div>
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

        {/* FOOTER */}
        <footer className="text-center text-xs text-gray-400 pt-6">
          © 2026 PPBMS · Universiti Sains Malaysia  
          <br />
          Developed by Hazwani Ahmad Yusof (2025)
        </footer>

      </div>
    </div>
  );
}
