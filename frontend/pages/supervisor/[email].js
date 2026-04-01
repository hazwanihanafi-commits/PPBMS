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
    transition={{ type: "spring", stiffness: 200, damping: 15 }}
    className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-white/40"
  >
    {children}
  </motion.div>
);

/* ================= CHART ================= */
function AnalyticsChart({ completed, soon, late }) {
  const data = [
    { name: "Completed", value: completed },
    { name: "Soon", value: soon },
    { name: "Late", value: late },
  ];

  return (
    <GlassCard>
      <h3 className="font-semibold mb-3">Timeline Analytics</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <Tooltip />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
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

    pdf.setFontSize(16);
    pdf.text("Student Progress Report", 20, 20);

    pdf.setFontSize(12);
    pdf.text(`Name: ${student.student_name}`, 20, 40);
    pdf.text(`Progress: ${progress}%`, 20, 50);
    pdf.text(`Risk: ${riskScore}`, 20, 60);

    timeline.forEach((t, i) => {
      pdf.text(`${i + 1}. ${t.activity} - ${t.status}`, 20, 80 + i * 10);
    });

    pdf.save("report.pdf");
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#eef2ff] to-[#f1f5f9] flex">

      {/* SIDEBAR */}
      <div className="w-60 p-4">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 shadow-sm space-y-2">

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

          <button
            onClick={() => router.push("/supervisor")}
            className="text-sm text-purple-600 mt-4"
          >
            ← Back
          </button>

        </div>
      </div>

      {/* MAIN */}
      <motion.div
        className="flex-1 p-6 space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >

        {/* BUTTON */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={exportPDF}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl shadow"
        >
          Export PDF
        </motion.button>

        {/* HERO */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-3xl p-6 shadow-lg">

          <h1 className="text-xl font-semibold">
            {student.student_name}
          </h1>

          <p className="text-sm text-white/80">
            {student.programme}
          </p>

          <div className="mt-4 flex justify-between">
            <span className="text-3xl">{progress}%</span>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
              {riskScore}
            </span>
          </div>

          <div className="mt-3 h-1.5 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8 }}
              className="h-1.5 bg-white rounded-full"
            />
          </div>

        </div>

        {/* TAB CONTENT */}
        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">

              <GlassCard>
                <p><strong>Email:</strong> {student.email}</p>
                <p><strong>Co-Supervisor:</strong> {coSupervisorDisplay}</p>
              </GlassCard>

              <GlassCard>
                <p className="font-semibold">{riskScore}</p>
              </GlassCard>

              <div className="grid grid-cols-3 gap-4">
                <GlassCard><p>Completed: {completed}</p></GlassCard>
                <GlassCard><p>Due Soon: {soon}</p></GlassCard>
                <GlassCard><p>Late: {late}</p></GlassCard>
              </div>

              <AnalyticsChart completed={completed} soon={soon} late={late} />

            </div>
          )}

          {/* DOCUMENTS */}
          {activeTab === "documents" && (
            <SupervisorChecklist documents={student.documents || {}} />
          )}

          {/* TIMELINE */}
          {activeTab === "timeline" && (
            <div className="space-y-3">
              {timeline.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl border
                    ${
                      t.status === "Late"
                        ? "bg-red-50 border-red-300"
                        : t.status === "Due Soon"
                        ? "bg-yellow-50 border-yellow-300"
                        : t.status === "Completed"
                        ? "bg-green-50 border-green-300"
                        : "bg-white"
                    }`}
                >
                  <p className="font-medium">{t.activity}</p>
                  <span className="text-xs">{t.status}</span>
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
            <SupervisorRemark
              studentMatric={student.student_id}
              studentEmail={student.email}
            />
          )}

        </motion.div>

      </motion.div>
    </div>
  );
}
