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
    whileHover={{ y: -4, scale: 1.02 }}
    className="
      bg-white/70
      backdrop-blur-xl
      rounded-2xl
      p-5
      shadow-sm
      border
      border-white/40
    "
  >
    {children}
  </motion.div>
);

/* ================= HELPERS ================= */

function getStatusType(t) {

  const status =
    t.status
      ?.trim()
      .toLowerCase();

  if (
    status === "late" ||
    t.status === "AT_RISK"
  ) {
    return "late";
  }

  if (status === "due soon") {
    return "soon";
  }

  if (status === "completed") {
    return "done";
  }

  return "normal";
}

function getRiskColor(risk) {

  if (risk === "HIGH RISK") {
    return "text-red-600";
  }

  if (risk === "MODERATE RISK") {
    return "text-amber-600";
  }

  return "text-green-600";
}

function getRiskBg(risk) {

  if (risk === "HIGH RISK") {
    return "bg-red-100";
  }

  if (risk === "MODERATE RISK") {
    return "bg-amber-100";
  }

  return "bg-green-100";
}

/* ================= PAGE ================= */

export default function SupervisorStudentPage() {

  const router = useRouter();

  const { email } =
    router.query;

  const [student, setStudent] =
    useState(null);

  const [timeline, setTimeline] =
    useState([]);

  const [cqi, setCqi] =
    useState({});

  const [activeTab, setActiveTab] =
    useState("overview");

  const [loading, setLoading] =
    useState(true);

  const [
    selectedAssessment,
    setSelectedAssessment,
  ] = useState("PROGRESS_1");

  /* ================= LOAD ================= */

  useEffect(() => {

    if (!email) return;

    loadStudent();

  }, [email]);

  async function loadStudent() {

    try {

      const token =
        localStorage.getItem(
          "ppbms_token"
        );

      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await res.json();

      setStudent(data.row || null);

      setTimeline(
        data.row?.timeline || []
      );

      setCqi(
        data.row?.cqiByAssessment || {}
      );

    } catch (e) {

      console.error(e);

    }

    setLoading(false);
  }

  /* ================= LOADING ================= */

  if (loading) {

    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  if (!student) {

    return (
      <div className="p-6">
        Student not found
      </div>
    );
  }

  /* ================= DATA ================= */

  const completed = timeline.filter(
    (t) =>
      t.status
        ?.trim()
        .toLowerCase() ===
      "completed"
  ).length;

  const late = timeline.filter(
    (t) =>

      t.status
        ?.trim()
        .toLowerCase() ===
        "late" ||

      t.status
        ?.trim()
        .toUpperCase() ===
        "AT_RISK" ||

      (
        !t.actual &&
        t.remaining_days < 0 &&
        t.status
          ?.trim()
          .toLowerCase() !==
          "completed"
      )
  ).length;

  const soon = timeline.filter(
    (t) =>
      t.status
        ?.trim()
        .toLowerCase() ===
      "due soon"
  ).length;

  const progress = timeline.length
    ? Math.round(
        (
          completed /
          timeline.length
        ) * 100
      )
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
    student.coSupervisor ||
    "-";

  /* ================= CURRENT REMARK ================= */

  const currentRemark = (() => {

  const remarks =
    student?.remarksByAssessment || [];

  const found =
    remarks.find(r =>

      selectedAssessment.startsWith("PROGRESS")

        ? r.assessmentInstance === selectedAssessment

        : r.assessmentType === selectedAssessment
    );

  return found?.remark || "";

})();

  /* ================= PDF ================= */

  function exportPDF() {

    const pdf = new jsPDF();

    let y = 20;

    pdf.setFontSize(16);

    pdf.text(
      "Postgraduate Progress Report",
      105,
      y,
      {
        align: "center",
      }
    );

    y += 10;

    pdf.text(
      `Name: ${student.student_name}`,
      20,
      y
    );

    y += 7;

    pdf.text(
      `Programme: ${student.programme}`,
      20,
      y
    );

    y += 7;

    pdf.text(
      `Risk: ${riskScore}`,
      20,
      y
    );

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

    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#eef2ff] to-[#f1f5f9] flex">

      {/* SIDEBAR */}

      <div className="w-56 p-4">

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 shadow">

          <h2 className="font-bold text-purple-700 mb-4">
            PPBMS
          </h2>

          <button
            onClick={() =>
              router.push("/supervisor")
            }
            className="mb-3 text-sm text-purple-600 hover:underline"
          >
            ← Back to Dashboard
          </button>

          {[
            "overview",
            "documents",
            "timeline",
            "cqi",
            "remarks",
          ].map((tab) => (

            <button
              key={tab}
              onClick={() =>
                setActiveTab(tab)
              }
              className={`
                w-full
                text-left
                px-3
                py-2
                rounded-lg
                text-sm
                mb-1

                ${
                  activeTab === tab
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }
              `}
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

          <h1 className="text-xl font-bold text-gray-800">
            Student Overview
          </h1>

          <button
            onClick={exportPDF}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl"
          >
            Export PDF
          </button>

        </div>

        {/* HERO */}

        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-3xl p-6">

          <h1 className="text-xl font-semibold">
            {student.student_name}
          </h1>

          <p className="text-sm">
            {student.programme}
          </p>

          <div className="mt-4 flex justify-between items-center">

            <span className="text-3xl">
              {progress}%
            </span>

            <span
              className={`
                px-3
                py-1
                rounded-full
                text-xs
                font-semibold

                ${getRiskBg(riskScore)}
                ${getRiskColor(riskScore)}
              `}
            >
              {riskScore}
            </span>

          </div>

        </div>

        {/* ANALYTICS */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <GlassCard>
            <p className="text-xs text-gray-500">
              Completed
            </p>

            <p className="text-2xl font-bold text-green-600">
              {completed}
            </p>
          </GlassCard>

          <GlassCard>
            <p className="text-xs text-gray-500">
              Due Soon
            </p>

            <p className="text-2xl font-bold text-amber-600">
              {soon}
            </p>
          </GlassCard>

          <GlassCard>
            <p className="text-xs text-gray-500">
              Late
            </p>

            <p className="text-2xl font-bold text-red-600">
              {late}
            </p>
          </GlassCard>

        </div>

        {/* GRAPH */}

        <GlassCard>

          <ResponsiveContainer
            width="100%"
            height={200}
          >

            <BarChart
              data={[
                {
                  name: "Done",
                  value: completed,
                },
                {
                  name: "Soon",
                  value: soon,
                },
                {
                  name: "Late",
                  value: late,
                },
              ]}
            >

              <XAxis dataKey="name" />

              <Tooltip />

              <Bar dataKey="value" />

            </BarChart>

          </ResponsiveContainer>

        </GlassCard>

        {/* DOCUMENTS */}

        {activeTab === "documents" && (

          <SupervisorChecklist
            documents={
              student.documents || {}
            }
            studentEmail={student.email}
            onUpdated={loadStudent}
          />

        )}

        {/* CQI */}

        {activeTab === "cqi" && (

          <FinalPLOTable
            finalPLO={student.finalPLO}
          />

        )}

        {/* REMARKS */}

        {activeTab === "remarks" && (

          <div className="space-y-4">

            <div className="bg-white rounded-xl p-4">

              <label className="block text-sm font-medium mb-2">
                Assessment Type
              </label>

              <select
                value={selectedAssessment}
                onChange={(e) =>
                  setSelectedAssessment(
                    e.target.value
                  )
                }
                className="border rounded-lg px-3 py-2 text-sm"
              >

                <option value="PROGRESS_1">
                  PROGRESS 1
                </option>

                <option value="PROGRESS_2">
                  PROGRESS 2
                </option>

                <option value="PROGRESS_3">
                  PROGRESS 3
                </option>

                <option value="PROGRESS_4">
                  PROGRESS 4
                </option>

                <option value="PROGRESS_5">
                  PROGRESS 5
                </option>

                <option value="PROGRESS_6">
                  PROGRESS 6
                </option>

                <option value="PROGRESS_7">
                  PROGRESS 7
                </option>

                <option value="VIVA">
                  VIVA
                </option>

                <option value="THESIS">
                  THESIS
                </option>

                <option value="TURNITIN">
                  TURNITIN
                </option>

                <option value="TRX500">
                  TRX500
                </option>

              </select>

            </div>

            <SupervisorRemark
              studentMatric={student.student_id}
              studentEmail={student.email}
              assessmentType={
                selectedAssessment.startsWith("PROGRESS")
                  ? "PROGRESS"
                  : selectedAssessment
              }
              assessmentInstance={selectedAssessment}
              initialRemark={currentRemark}
            />

          </div>

        )}

        {/* FOOTER */}

        <footer className="text-center text-xs text-gray-400 pt-6">

          © 2026 PPBMS ·
          Universiti Sains Malaysia

          <br />

          Developed by
          Hazwani Ahmad Yusof
          (2025)

        </footer>

      </div>

    </div>
  );
}
