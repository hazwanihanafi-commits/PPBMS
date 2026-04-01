import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
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

/* ================= CHART ================= */
function AnalyticsChart({ completed, soon, late }) {
  const data = [
    { name: "Completed", value: completed },
    { name: "Due Soon", value: soon },
    { name: "Late", value: late },
  ];

  return (
    <div className="bg-white/40 backdrop-blur-xl p-4 rounded-2xl shadow">
      <h3 className="font-semibold mb-3">Timeline Analytics</h3>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <Tooltip />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ================= MAIN ================= */

export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const reportRef = useRef();

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
    pdf.text(`Programme: ${student.programme}`, 20, 50);
    pdf.text(`Progress: ${progress}%`, 20, 60);
    pdf.text(`Risk: ${riskScore}`, 20, 70);

    pdf.text("Timeline:", 20, 90);

    timeline.forEach((t, i) => {
      pdf.text(`${i + 1}. ${t.activity} - ${t.status}`, 20, 100 + i * 10);
    });

    pdf.save(`${student.student_name}_report.pdf`);
  }

  /* ================= UI ================= */

  const GlassCard = ({ children }) => (
    <div className="relative p-5 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/30 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-transparent to-indigo-200 opacity-20 blur-xl"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#eef2ff] to-white">

      {/* SIDEBAR */}
      <div className="w-64 bg-white shadow-lg p-4 space-y-3">

        <h2 className="font-bold text-purple-700">PPBMS</h2>

        {["overview","documents","timeline","cqi","remarks"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`block w-full text-left px-4 py-2 rounded-xl ${
              activeTab === tab ? "bg-purple-600 text-white" : ""
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}

        <button onClick={() => router.push("/supervisor")}>
          ← Back
        </button>

      </div>

      {/* CONTENT */}
      <div className="flex-1 p-6 space-y-6">

        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl"
        >
          Export PDF
        </button>

        {/* HERO */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white p-6 rounded-2xl">
          <h1 className="text-2xl font-bold">
            {student.student_name}
          </h1>
          <p>{progress}% Progress</p>
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4">

            <GlassCard>
              <p><strong>Email:</strong> {student.email}</p>
              <p><strong>Co-Supervisor:</strong> {coSupervisorDisplay}</p>
            </GlassCard>

            <GlassCard>
              <p className="font-bold">{riskScore}</p>
            </GlassCard>

            <AnalyticsChart
              completed={completed}
              soon={soon}
              late={late}
            />

          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <SupervisorChecklist documents={student.documents || {}} />
        )}

        {/* TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            {timeline.map((t, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  t.status === "Late"
                    ? "bg-red-50 border-red-300"
                    : t.status === "Due Soon"
                    ? "bg-yellow-50 border-yellow-300"
                    : t.status === "Completed"
                    ? "bg-green-50 border-green-300"
                    : "bg-white"
                }`}
              >
                <p className="font-semibold">{t.activity}</p>
                <span>{t.status}</span>
              </div>
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

      </div>
    </div>
  );
}
