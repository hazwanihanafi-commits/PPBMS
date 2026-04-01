import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const reportRef = useRef();

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cqi, setCqi] = useState({});
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
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      setStudent(data.row || null);
      setTimeline(data.row?.timeline || []);
      setCqi(data.row?.cqiByAssessment || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  /* ================= EXPORT PDF ================= */
  async function exportPDF() {
    const element = reportRef.current;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`${student.student_name}_Report.pdf`);
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  /* ================= DATA ================= */
  const completed = timeline.filter(t => t.status === "Completed").length;
  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  const hasRisk =
    timeline.some(t => t.status === "Late" || t.status === "Due Soon");

  const GlassCard = ({ children }) => (
    <div className="relative rounded-3xl p-5 bg-white/40 backdrop-blur-xl border border-white/30 shadow-xl overflow-hidden transition hover:scale-[1.03]">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-transparent to-indigo-200 opacity-30 blur-2xl"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#ede9fe] p-6 space-y-6">

      {/* BACK + EXPORT */}
      <div className="flex justify-between">
        <button
          onClick={() => router.push("/supervisor")}
          className="text-purple-700 hover:underline"
        >
          ← Back
        </button>

        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700"
        >
          Export PDF
        </button>
      </div>

      {/* REPORT AREA */}
      <div ref={reportRef} className="space-y-6">

        {/* HERO */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white p-6 rounded-3xl shadow-xl">
          <h1 className="text-2xl font-semibold">
            {student.student_name}
          </h1>

          <p className="text-sm text-purple-100">
            {student.programme}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {progress}% Progress
          </p>

          <div className="mt-3 h-2 bg-white/30 rounded">
            <div
              className="h-2 bg-white rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ANALYTICS */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* DISTRIBUTION */}
          <GlassCard>
            <h3 className="font-semibold mb-2">Timeline Status</h3>

            {["Completed","On Time","Due Soon","Late"].map(status => {
              const count = timeline.filter(t => t.status === status).length;

              return (
                <p key={status} className="text-sm">
                  {status}: {count}
                </p>
              );
            })}
          </GlassCard>

          {/* RISK */}
          <GlassCard>
            <h3 className="font-semibold mb-2">Risk Assessment</h3>
            <p className={hasRisk ? "text-red-600" : "text-green-600"}>
              {hasRisk
                ? "Intervention Required"
                : "On Track"}
            </p>
          </GlassCard>

          {/* INSIGHT */}
          <GlassCard>
            <h3 className="font-semibold mb-2">System Insight</h3>
            <p className="text-sm">
              {hasRisk
                ? "Student shows delay in milestones. Supervisor action recommended."
                : "Student progressing within expected timeline."}
            </p>
          </GlassCard>

        </div>

        {/* TIMELINE */}
        <div className="bg-white rounded-2xl p-6 shadow">
          <h3 className="font-semibold mb-3">Timeline</h3>

          {timeline.map((t, i) => (
            <p key={i} className="text-sm border-b py-1">
              {t.activity} — {t.status}
            </p>
          ))}
        </div>

      </div>

      {/* FOOTER */}
      <footer className="text-center text-xs text-gray-400 pt-6 border-t">
        © 2026 PPBMS · Universiti Sains Malaysia  
        <br />
        Developed by Hazwani Ahmad Yusof (2025)
      </footer>

    </div>
  );
}
