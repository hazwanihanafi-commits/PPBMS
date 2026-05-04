import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import jsPDF from "jspdf";

import { API_BASE } from "../../../utils/api";
import SupervisorChecklist from "../../../components/SupervisorChecklist";
import FinalPLOTable from "../../../components/FinalPLOTable";

/* ========= LOAD CHART (SSR SAFE) ========= */
const RadarChart = dynamic(
  () => import("recharts").then(m => m.RadarChart),
  { ssr: false }
);
const PolarGrid = dynamic(() => import("recharts").then(m => m.PolarGrid), { ssr: false });
const PolarAngleAxis = dynamic(() => import("recharts").then(m => m.PolarAngleAxis), { ssr: false });
const PolarRadiusAxis = dynamic(() => import("recharts").then(m => m.PolarRadiusAxis), { ssr: false });
const Radar = dynamic(() => import("recharts").then(m => m.Radar), { ssr: false });

/* ================= CARD ================= */
const Card = ({ children }) => (
  <div className="bg-white rounded-2xl p-5 shadow border">
    {children}
  </div>
);

/* ================= PAGE ================= */
export default function AdminStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [finalPLO, setFinalPLO] = useState({});
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
        `${API_BASE}/api/admin/student/${encodeURIComponent(email)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();

      setStudent(data.student || null);
      setTimeline(data.timeline || []);
      setRemarks(data.remarks || []);
      setFinalPLO(data.finalPLO || {});
    } catch (err) {
      console.error("LOAD ERROR:", err);
      setStudent(null);
    }

    setLoading(false);
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  /* ================= CALC ================= */
  const completed = timeline.filter(t => t.status === "Completed").length;
  const late = timeline.filter(t => t.status === "Late").length;
  const soon = timeline.filter(t => t.status === "Due Soon").length;

  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  const risk =
    late >= 3 ? "HIGH RISK" :
    late > 0 || soon > 2 ? "MODERATE RISK" :
    "LOW RISK";

  const coSupervisor =
    Array.isArray(student.coSupervisors)
      ? student.coSupervisors.join(", ")
      : student.coSupervisors || "-";

  /* ================= PDF ================= */
  function exportPDF() {
    const pdf = new jsPDF();
    let y = 20;

    pdf.text("PPBMS Report", 20, y); y += 10;

    pdf.text(`Name: ${student.student_name}`, 20, y); y += 6;
    pdf.text(`Programme: ${student.programme}`, 20, y); y += 6;
    pdf.text(`Risk: ${risk}`, 20, y); y += 10;

    timeline.forEach((t, i) => {
      pdf.text(`${i+1}. ${t.activity || t.name} (${t.status})`, 20, y);
      y += 5;
    });

    pdf.save("report.pdf");
  }

  /* ================= RADAR DATA ================= */
  const radarData = Object.entries(finalPLO || {}).map(([k, v]) => ({
    plo: k,
    value: v?.average || 0
  }));

  /* ================= UI ================= */
  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* SIDEBAR */}
      <div className="w-60 bg-white border-r p-5">
        <h2 className="font-bold text-purple-600 mb-6">PPBMS</h2>

        {["overview","timeline","documents","cqi","remarks"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`block w-full text-left px-3 py-2 mb-2 rounded-lg ${
              activeTab === tab
                ? "bg-purple-600 text-white"
                : "hover:bg-gray-100"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between">
          <h1 className="text-xl font-bold">Student Dashboard</h1>
          <button onClick={exportPDF} className="bg-purple-600 text-white px-4 py-2 rounded-lg">
            Export PDF
          </button>
        </div>

        {/* HERO */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-2xl flex justify-between"
        >
          <div>
            <h2 className="text-xl font-bold">{student.student_name}</h2>
            <p>{student.programme}</p>
            <p className="text-3xl mt-2">{progress}%</p>
          </div>

          <span className={`px-4 py-2 rounded-full ${
            risk === "HIGH RISK" ? "bg-red-500" :
            risk === "MODERATE RISK" ? "bg-orange-400" :
            "bg-green-500"
          }`}>
            {risk}
          </span>
        </motion.div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4">
          <Card>Completed: {completed}</Card>
          <Card>Due Soon: {soon}</Card>
          <Card>Late: {late}</Card>
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <Card>
            <p><b>Email:</b> {student.email}</p>
            <p><b>Supervisor:</b> {student.supervisor}</p>
            <p><b>Co-Supervisor:</b> {coSupervisor}</p>
          </Card>
        )}

        {/* TIMELINE */}
        {activeTab === "timeline" && (
          <Card>
            {timeline.map((t, i) => (
              <motion.div key={i} className="mb-4">
                <b>{t.activity || t.name}</b>
                <p className="text-sm">
                  {(t.expected || t.expected_date)} → {(t.actual || t.completed_date || "-")}
                </p>
              </motion.div>
            ))}
          </Card>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <Card>
            <SupervisorChecklist documents={student.documents || {}} />
          </Card>
        )}

        {/* CQI */}
        {activeTab === "cqi" && (
          <Card>
            <FinalPLOTable finalPLO={finalPLO} />

            <div className="flex justify-center mt-6">
              <RadarChart width={300} height={250} data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="plo" />
                <PolarRadiusAxis />
                <Radar dataKey="value" fill="#7c3aed" fillOpacity={0.6} />
              </RadarChart>
            </div>
          </Card>
        )}

        {/* REMARKS */}
        {activeTab === "remarks" && (
          <Card>
            {!remarks.length && <p>No remarks</p>}

            {remarks.map((r, i) => (
              <motion.div key={i} className="mb-4">
                <h4 className="text-purple-600 font-bold">
                  {r.assessment_type || r.type || "Assessment"}
                </h4>

                <div className="bg-gray-100 p-3 rounded">
                  {r.remark || r.comment || "-"}
                </div>
              </motion.div>
            ))}
          </Card>
        )}

        {/* FOOTER */}
        <div className="text-center text-xs text-gray-400 mt-6">
          © 2026 PPBMS · Universiti Sains Malaysia
        </div>

      </div>
    </div>
  );
}
