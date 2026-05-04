import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { API_BASE } from "../../utils/api";
import jsPDF from "jspdf";

import SupervisorChecklist from "../../components/SupervisorChecklist";
import FinalPLOTable from "../../components/FinalPLOTable";

/* ================= CARD ================= */
const Card = ({ children }) => (
  <div className="bg-white rounded-2xl p-5 shadow border">
    {children}
  </div>
);

/* ================= PAGE ================= */
export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [finalPLO, setFinalPLO] = useState({});
  const [activeTab, setActiveTab] = useState("timeline"); // ✅ better default
  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false); // ✅ mobile fix

  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  /* ================= LOAD ================= */
  async function loadStudent() {
    try {
      const token = localStorage.getItem("ppbms_token");

      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      const row = data.row || {};

      setStudent(row);
      setTimeline(row.timeline || []);
      setRemarks(row.remarksByAssessment || []);
      setFinalPLO(row.finalPLO || {});

      console.log("TIMELINE:", row.timeline); // 🔍 debug
    } catch (err) {
      console.error("LOAD ERROR:", err);
      setStudent(null);
    }

    setLoading(false);
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  /* ================= CALCULATIONS (FIXED) ================= */
  const completed = timeline.filter(
    t => t.status?.toLowerCase() === "completed"
  ).length;

  const late = timeline.filter(
    t => t.status?.toLowerCase() === "late"
  ).length;

  const soon = timeline.filter(
    t => t.status?.toLowerCase().includes("soon")
  ).length;

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

    pdf.text("PPBMS Student Report", 20, y); y += 10;

    pdf.text(`Name: ${student.student_name}`, 20, y); y += 6;
    pdf.text(`Matric: ${student.student_id}`, 20, y); y += 6;
    pdf.text(`Programme: ${student.programme}`, 20, y); y += 6;
    pdf.text(`Risk: ${risk}`, 20, y); y += 10;

    timeline.forEach((t, i) => {
      pdf.text(`${i + 1}. ${t.activity} (${t.status})`, 20, y);
      y += 5;
    });

    pdf.save(`${student.student_name}.pdf`);
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
          fixed md:static z-50
          w-60 h-full
          bg-gradient-to-b from-indigo-900 to-purple-800
          text-white p-6 space-y-6
          transform transition
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <h2 className="font-bold text-xl">PPBMS</h2>

        {["overview","timeline","documents","cqi","remarks"].map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSidebarOpen(false); // close on mobile
            }}
            className={`block w-full text-left px-3 py-2 rounded-lg ${
              activeTab === tab
                ? "bg-white text-purple-700"
                : "hover:bg-white/20"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* MOBILE MENU BUTTON */}
            <button
              className="md:hidden bg-white p-2 rounded shadow"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>

            <h1 className="text-xl font-bold">
              Student Monitoring Dashboard
            </h1>
          </div>

          <button
            onClick={exportPDF}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            Export PDF
          </button>
        </div>

        {/* HERO */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-2xl flex justify-between">
          <div>
            <h2 className="text-xl font-bold">{student.student_name}</h2>
            <p>{student.programme}</p>
            <p className="text-3xl mt-2">{progress}%</p>

            <div className="mt-2 bg-white/20 h-2 rounded-full">
              <motion.div
                className="bg-white h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <span className="px-4 py-2 rounded-full text-xs font-bold bg-white/20">
            {risk}
          </span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <p>Completed</p>
            <p className="text-2xl text-green-600">{completed}</p>
          </Card>

          <Card>
            <p>Due Soon</p>
            <p className="text-2xl text-orange-500">{soon}</p>
          </Card>

          <Card>
            <p>Late</p>
            <p className="text-2xl text-red-500">{late}</p>
          </Card>
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <Card>
            <p><b>Email:</b> {student.email}</p>
            <p><b>Matric:</b> {student.student_id}</p>
            <p><b>Programme:</b> {student.programme}</p>
            <p><b>Field:</b> {student.field || "-"}</p> {/* ✅ FIX */}
            <p><b>Supervisor:</b> {student.supervisor}</p>
            <p><b>Co-Supervisor:</b> {coSupervisor}</p>
          </Card>
        )}

        {/* TIMELINE */}
        {activeTab === "timeline" && (
          <Card>
            <h3 className="font-bold mb-4">Milestone Timeline</h3>

            {!timeline.length && (
              <div className="text-gray-400 text-center">
                No timeline data
              </div>
            )}

            <div className="space-y-4">
              {timeline.map((t, i) => (
                <div key={i} className="border-l-4 pl-4 py-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <b>{t.activity}</b>
                    <span className="text-xs text-gray-500">
                      {t.remaining_days ?? "-"} days
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">
                    Expected: {t.expected} | Completed: {t.actual || "-"}
                  </p>

                  <span className={`text-xs font-bold ${
                    t.status?.toLowerCase() === "late"
                      ? "text-red-600"
                      : t.status?.toLowerCase().includes("soon")
                      ? "text-orange-500"
                      : "text-green-600"
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
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
          </Card>
        )}

        {/* REMARKS */}
        {activeTab === "remarks" && (
          <Card>
            <h3 className="font-semibold mb-4 text-lg">
              📝 Supervisor Remarks
            </h3>

            {!remarks.length && (
              <div className="text-center py-10 text-gray-400">
                No remarks available
              </div>
            )}

            <div className="space-y-5">
              {remarks.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white border rounded-2xl p-5 shadow-sm"
                >
                  <h4 className="text-purple-600 font-semibold">
                    {r.assessmentType || r.assessmentInstance || "Assessment"}
                  </h4>

                  <div className="bg-gray-50 border rounded-xl p-4 mt-3">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {r.remark || "-"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {/* FOOTER */}
        <div className="text-center text-xs text-gray-400">
          © 2026 PPBMS · Universiti Sains Malaysia
        </div>

      </div>
    </div>
  );
}
