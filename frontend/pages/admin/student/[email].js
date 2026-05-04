// ==========================================
// ADMIN STUDENT PAGE (FULL - MATCH SUPERVISOR)
// ==========================================

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import jsPDF from "jspdf";

import { API_BASE } from "../../../utils/api";
import SupervisorChecklist from "../../../components/SupervisorChecklist";
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
  const [documents, setDocuments] = useState({});
  const [remarks, setRemarks] = useState([]);
  const [finalPLO, setFinalPLO] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */
  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  async function loadStudent() {

  try {
    const token = localStorage.getItem("ppbms_token");

    const res = await fetch(
      `${API_BASE}/api/admin/student/${email}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    console.log("ADMIN DATA:", data);

    const row = data.row || {};

    setStudent(row);
    setTimeline(row.timeline || []);
    setDocuments(row.documents || {});
    setRemarks(row.remarksByAssessment || []);
    setFinalPLO(row.finalPLO || {});

  } catch (err) {
    console.error(err);
    setStudent(null);
  }

  setLoading(false);
}
 

  /* ================= CALC ================= */
  const completed = timeline.filter(
    t => String(t.status).toUpperCase() === "COMPLETED"
  ).length;

  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  let category = "At Risk";

  if (progress >= 80) category = "On Track";
  else if (progress >= 50) category = "Slightly Late";

  const coSupervisor =
    Array.isArray(student.coSupervisors)
      ? student.coSupervisors.join(", ")
      : student.coSupervisors || "-";

  /* ================= PDF ================= */
  function exportPDF() {

    const pdf = new jsPDF();
    let y = 20;

    pdf.text("PPBMS Student Report", 20, y); y += 10;

    pdf.text(`Name: ${student.name}`, 20, y); y += 6;
    pdf.text(`Programme: ${student.programme}`, 20, y); y += 6;
    pdf.text(`Progress: ${progress}%`, 20, y); y += 6;
    pdf.text(`Status: ${category}`, 20, y); y += 10;

    timeline.forEach((t, i) => {
      pdf.text(`${i+1}. ${t.activity || t.name} (${t.status})`, 20, y);
      y += 5;
    });

    pdf.save("student-report.pdf");
  }

  /* ================= UI ================= */
  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* SIDEBAR */}
      <div className="w-60 bg-white border-r p-5">

        <h2 className="font-bold text-purple-600 mb-6">
          PPBMS Admin
        </h2>

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

        <button
          onClick={() => router.push("/admin")}
          className="mt-6 text-sm text-gray-500 hover:underline"
        >
          ← Back
        </button>

      </div>

      {/* MAIN */}
      <div className="flex-1 p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between">
          <h1 className="text-xl font-bold">
            Student Dashboard
          </h1>

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
            <h2 className="text-xl font-bold">{student.name}</h2>
            <p>{student.programme}</p>
            <p className="text-3xl mt-2">{progress}%</p>
          </div>

          <span className={`px-4 py-2 rounded-full ${
            category === "At Risk"
              ? "bg-red-500"
              : category === "Slightly Late"
              ? "bg-yellow-400 text-black"
              : "bg-green-500"
          }`}>
            {category}
          </span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4">
          <Card>Completed: {completed}</Card>
          <Card>Total: {timeline.length}</Card>
          <Card>Remaining: {timeline.length - completed}</Card>
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <Card>
            <p><b>Email:</b> {student.email}</p>
            <p><b>Matric:</b> {student.student_id}</p>
            <p><b>Supervisor:</b> {student.mainSupervisor}</p>
            <p><b>Co-Supervisor:</b> {coSupervisor}</p>
          </Card>
        )}

        {/* TIMELINE */}
        {activeTab === "timeline" && (
          <Card>
            {timeline.map((t, i) => (
              <div key={i} className="mb-4 border-l-4 pl-3">
                <b>{t.activity}</b>
                <p className="text-xs">{t.expected} → {t.actual || "-"}</p>
                <span className="text-xs">{t.status}</span>
              </div>
            ))}
          </Card>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <Card>
            <SupervisorChecklist documents={documents} />
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
            {!remarks.length && <p>No remarks</p>}

            {remarks.map((r, i) => (
              <div key={i} className="mb-4">
                <h4 className="text-purple-600 font-bold">
                  {r.assessmentType || r.type}
                </h4>

                <div className="bg-gray-100 p-3 rounded">
                  {r.remark || r.comment}
                </div>
              </div>
            ))}
          </Card>
        )}

      </div>
    </div>
  );
}
