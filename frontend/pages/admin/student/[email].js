import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { API_BASE } from "../../../utils/api";
import jsPDF from "jspdf";

import SupervisorChecklist from "../../../components/SupervisorChecklist";
import SupervisorRemark from "../../../components/SupervisorRemark";
import FinalPLOTable from "../../../components/FinalPLOTable";

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

      if (!res.ok) {
        const text = await res.text();
        console.error("API ERROR:", text);
        setStudent(null);
        setLoading(false);
        return;
      }

      const data = await res.json();

      setStudent(data.row || null);
      setTimeline(data.row?.timeline || []);

    } catch (err) {
      console.error("LOAD ERROR:", err);
      setStudent(null);
    }

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

    pdf.setFontSize(16);
    pdf.text("UNIVERSITI SAINS MALAYSIA", 105, y, { align: "center" });

    y += 8;
    pdf.setFontSize(11);
    pdf.text("Postgraduate Progress Report", 105, y, { align: "center" });

    y += 12;

    pdf.text(`Name: ${student.student_name}`, 20, y); y += 6;
    pdf.text(`Matric: ${student.student_id}`, 20, y); y += 6;
    pdf.text(`Programme: ${student.programme}`, 20, y); y += 6;
    pdf.text(`Supervisor: ${student.supervisor}`, 20, y); y += 6;
    pdf.text(`Co-Supervisor: ${coSupervisor}`, 20, y); y += 8;

    pdf.text(`Risk Level: ${risk}`, 20, y); y += 10;

    pdf.text("Timeline:", 20, y); y += 6;

    timeline.forEach((t, i) => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(
        `${i + 1}. ${t.activity} (${t.status}) ${
          t.status !== "Completed" ? `- ${t.remaining_days} days` : ""
        }`,
        20,
        y
      );

      y += 5;
    });

    y += 8;

    pdf.text("PLO:", 20, y); y += 6;

    Object.entries(student.finalPLO || {}).forEach(([plo, d]) => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(`${plo}: ${d.average ?? "-"} (${d.status})`, 20, y);
      y += 5;
    });

    pdf.save(`${student.student_name}.pdf`);
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* SIDEBAR */}
      <div className="w-60 bg-white border-r p-5 space-y-6">
        <h2 className="font-bold text-lg text-purple-600">PPBMS</h2>

        <div className="space-y-2">
          {["overview","documents","timeline","cqi","remarks"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
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
      <div className="flex-1 p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Student Overview</h1>

          <button
            onClick={exportPDF}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            Export PDF
          </button>
        </div>

        {/* HERO */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-2xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{student.student_name}</h2>
            <p className="text-sm">{student.programme}</p>
            <p className="text-3xl font-bold mt-2">{progress}%</p>

            <div className="mt-3 w-64 bg-white/20 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1 }}
                className="h-2 bg-white"
              />
            </div>
          </div>

          <span
            className={`px-4 py-2 rounded-full text-xs font-semibold ${
              risk === "HIGH RISK"
                ? "bg-red-500"
                : risk === "MODERATE RISK"
                ? "bg-orange-400"
                : "bg-green-500"
            }`}
          >
            {risk}
          </span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <p className="text-gray-500 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completed}</p>
          </Card>

          <Card>
            <p className="text-gray-500 text-sm">Due Soon</p>
            <p className="text-2xl font-bold text-orange-500">{soon}</p>
          </Card>

          <Card>
            <p className="text-gray-500 text-sm">Late</p>
            <p className="text-2xl font-bold text-red-600">{late}</p>
          </Card>
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <Card>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <p><b>Email:</b> {student.email}</p>
              <p><b>Matric:</b> {student.student_id}</p>
              <p><b>Supervisor:</b> {student.supervisor}</p>
              <p><b>Co-Supervisor:</b> {coSupervisor}</p>
            </div>
          </Card>
        )}

        {/* TIMELINE */}
        {activeTab === "timeline" && (
          <Card>
            <h3 className="font-semibold mb-4">Milestone Timeline</h3>

            <div className="space-y-4">
              {timeline.map((t, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border-l-4 ${
                    t.status === "Late"
                      ? "bg-red-50 border-red-400"
                      : t.status === "Due Soon"
                      ? "bg-orange-50 border-orange-400"
                      : "bg-green-50 border-green-400"
                  }`}
                >
                  <div className="flex justify-between">
                    <p className="font-semibold">{t.activity}</p>
                    <span className="text-xs text-gray-500">
                      {t.remaining_days ?? ""} days
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    {t.expected} → {t.actual || "-"}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <Card>
            <h3 className="font-semibold mb-4">📄 Submitted Documents</h3>
            <SupervisorChecklist documents={student.documents || {}} />
          </Card>
        )}

        {/* CQI */}
        {activeTab === "cqi" && (
          <Card>
            <h3 className="font-semibold mb-4">📊 CQI Performance</h3>
            <FinalPLOTable finalPLO={student.finalPLO} />
          </Card>
        )}

        {/* REMARKS */}
{activeTab === "remarks" && (
  <Card>
    <h3 className="font-semibold mb-4">Supervisor Remarks</h3>

    {!student.remarks?.length && (
      <p className="text-gray-500 text-sm">No remarks available</p>
    )}

    <div className="space-y-6">
      {student.remarks?.map((r, i) => {

        // ✅ HANDLE ALL POSSIBLE BACKEND FIELDS
        const type =
          r.assessmentType ||
          r.assessment_type ||
          r.type ||
          "Assessment";

        const remark =
          r.remark ||
          r.comment ||
          r.remark_text ||
          "-";

        return (
          <div
            key={i}
            className="bg-white border rounded-2xl p-5 shadow-sm"
          >

            {/* TITLE */}
            <h4 className="text-purple-600 font-semibold">
              {type}
            </h4>

            {/* SUB LABEL */}
            <p className="text-xs text-gray-500 mb-3">
              Assessment Type: {type}
            </p>

            {/* TEXTAREA STYLE DISPLAY */}
            <div className="bg-gray-50 border rounded-xl p-4 min-h-[100px]">
              <p className="text-gray-700 whitespace-pre-wrap">
                {remark}
              </p>
            </div>

          </div>
        );
      })}
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
