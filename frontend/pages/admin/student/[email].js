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
    const token = localStorage.getItem("ppbms_token");

    const res = await fetch(
      `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();

    setStudent(data.row || null);
    setTimeline(data.row?.timeline || []);
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
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">

      {/* BACK */}
      <button
        onClick={() => {
          if (window.history.length > 1) router.back();
          else router.push("/admin");
        }}
        className="text-red-600 text-sm"
      >
        ← Back
      </button>

      {/* HERO */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-2xl">
        <h1 className="text-xl font-bold">{student.student_name}</h1>
        <p>{student.programme}</p>

        <div className="mt-3 flex justify-between">
          <span className="text-2xl font-bold">{progress}%</span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
            {risk}
          </span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">
        {["overview","documents","timeline","cqi","remarks"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm ${
              activeTab === tab
                ? "bg-red-600 text-white"
                : "bg-red-100 text-red-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <Card>
            <p><b>Email:</b> {student.email}</p>
            <p><b>Matric:</b> {student.student_id}</p>
            <p><b>Supervisor:</b> {student.supervisor}</p>
            <p><b>Co-Supervisor:</b> {coSupervisor}</p>
          </Card>

          <div className="grid grid-cols-3 gap-2">
            <Card><p>Completed<br/><b>{completed}</b></p></Card>
            <Card><p>Due Soon<br/><b>{soon}</b></p></Card>
            <Card><p>Late<br/><b className="text-red-600">{late}</b></p></Card>
          </div>
        </div>
      )}

      {/* TIMELINE */}
      {activeTab === "timeline" && (
        <div className="space-y-3">
          {timeline.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-4 rounded-xl border ${
                t.status === "Late"
                  ? "bg-red-50 border-red-300"
                  : t.status === "Due Soon"
                  ? "bg-orange-50 border-orange-300"
                  : t.status === "Completed"
                  ? "bg-green-50 border-green-300"
                  : "bg-white"
              }`}
            >
              <p className="font-semibold">{t.activity}</p>

              <div className="flex justify-between mt-1">

                <span className="text-xs text-gray-500">
                  {t.expected} → {t.actual || "-"}
                </span>

                {t.status !== "Completed" && (
                  <span
                    className={`text-xs font-semibold ${
                      t.remaining_days < 0
                        ? "text-red-600"
                        : t.remaining_days <= 30
                        ? "text-orange-500"
                        : "text-blue-600"
                    }`}
                  >
                    {t.remaining_days} days
                  </span>
                )}

              </div>
            </motion.div>
          ))}
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

      {/* EXPORT */}
      <button
        onClick={exportPDF}
        className="w-full bg-red-600 text-white py-3 rounded-xl"
      >
        Export Report (PDF)
      </button>

      {/* FOOTER */}
      <footer className="text-center text-xs text-gray-400">
        © 2026 PPBMS · Universiti Sains Malaysia
      </footer>

    </div>
  );
}
