import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { API_BASE } from "../../utils/api";

import SupervisorChecklist from "../../components/SupervisorChecklist";
import FinalPLOTable from "../../components/FinalPLOTable";

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

import jsPDF from "jspdf";

/* ================= GLASS CARD ================= */

const GlassCard = ({ children }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    className="
      bg-white/70 backdrop-blur-xl
      rounded-2xl p-5
      shadow-md border border-white/40
      transition-all duration-300
    "
  >
    {children}
  </motion.div>
);

/* ================= HELPERS ================= */

function getStatusType(t) {
  const status = t.status?.trim().toLowerCase();

  if (status === "late" || t.status === "AT_RISK") return "late";
  if (status === "due soon") return "soon";
  if (status === "completed") return "done";

  return "normal";
}

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

/* ================= PAGE ================= */

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
    try {
      const token = localStorage.getItem("ppbms_token");

      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      const studentData = data.row || data.student || data;

      setStudent(studentData || null);
      setTimeline(studentData?.timeline || []);
      setCqi(studentData?.cqiByAssessment || {});

    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  /* ================= DATA ================= */

  const completed = timeline.filter(
    (t) => t.status?.toLowerCase() === "completed"
  ).length;

  const late = timeline.filter(
    (t) =>
      t.status?.toLowerCase() === "late" ||
      t.status?.toUpperCase() === "AT_RISK"
  ).length;

  const soon = timeline.filter(
    (t) => t.status?.toLowerCase() === "due soon"
  ).length;

  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  const riskScore =
    late > 2
      ? "HIGH RISK"
      : late > 0 || soon > 2
      ? "MODERATE RISK"
      : "LOW RISK";

  /* ================= CQI RADAR ================= */

  const radarData = [];

  Object.entries(cqi || {}).forEach(([assessment, plos]) => {
    Object.entries(plos).forEach(([plo, val]) => {
      radarData.push({
        subject: `${assessment}-${plo}`,
        score: val.average || 0,
        fullMark: 5,
      });
    });
  });

  /* ================= PDF ================= */

  function exportPDF() {
    const pdf = new jsPDF();
    let y = 20;

    pdf.setFontSize(16);
    pdf.text("PPBMS Progress Report", 105, y, { align: "center" });

    y += 10;
    pdf.text(`Student: ${student.student_name}`, 20, y);
    y += 6;
    pdf.text(`Programme: ${student.programme}`, 20, y);
    y += 6;
    pdf.text(`Risk: ${riskScore}`, 20, y);
    y += 10;

    timeline.forEach((t, i) => {
      pdf.text(`${i + 1}. ${t.activity} (${t.status})`, 20, y);
      y += 5;
    });

    pdf.save("report.pdf");
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#eef2ff] to-[#e0e7ff] flex">

      {/* SIDEBAR */}
      <div className="w-56 p-4">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 shadow">

          <h2 className="font-bold text-purple-700 mb-4">PPBMS</h2>

          {["overview","documents","timeline","cqi","remarks"].map((tab)=>(
            <button
              key={tab}
              onClick={()=>setActiveTab(tab)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 ${
                activeTab===tab
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
      <div className="flex-1 p-6 space-y-6">

        {/* HERO */}
        <motion.div className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-3xl p-6 shadow-xl">
          <h1 className="text-2xl font-bold">{student.student_name}</h1>
          <p className="text-sm">{student.programme}</p>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-4xl font-bold">{progress}%</p>

            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBg(riskScore)} ${getRiskColor(riskScore)}`}>
              {riskScore}
            </span>
          </div>
        </motion.div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-5">
          <GlassCard><p>Completed</p><p className="text-green-600 text-2xl">{completed}</p></GlassCard>
          <GlassCard><p>Soon</p><p className="text-amber-600 text-2xl">{soon}</p></GlassCard>
          <GlassCard><p>Late</p><p className="text-red-600 text-2xl">{late}</p></GlassCard>
        </div>

        {/* CHART */}
        <GlassCard>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: "Done", value: completed },
              { name: "Soon", value: soon },
              { name: "Late", value: late }
            ]}>
              <XAxis dataKey="name"/>
              <Tooltip/>
              <Bar dataKey="value" fill="#6366f1"/>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* TIMELINE */}
        {activeTab==="timeline" && (
          <GlassCard>
            <div className="border-l pl-6 space-y-4">
              {timeline.map((t,i)=>(
                <div key={i}>
                  <p className="font-semibold">{t.activity}</p>
                  <p className="text-xs text-gray-500">
                    {t.expected_date} → {t.actual || "-"}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* CQI RADAR */}
        {activeTab==="cqi" && (
          <GlassCard>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid/>
                <PolarAngleAxis dataKey="subject"/>
                <Radar dataKey="score" fill="#6366f1"/>
              </RadarChart>
            </ResponsiveContainer>
          </GlassCard>
        )}

        {/* DOCUMENT */}
        {activeTab==="documents" && (
          <SupervisorChecklist
            documents={student.documents || {}}
            studentEmail={student.email}
            onUpdated={loadStudent}
          />
        )}

        {/* FOOTER */}
        <footer className="text-center text-xs text-gray-400">
          © 2026 PPBMS
        </footer>

      </div>
    </div>
  );
}
