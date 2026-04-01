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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  /* ================= PDF ================= */
  async function exportPDF() {
    const canvas = await html2canvas(reportRef.current);
    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(img, "PNG", 0, 0, 210, 295);
    pdf.save(`${student.student_name}_report.pdf`);
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  const completed = timeline.filter(t => t.status === "Completed").length;
  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  const GlassCard = ({ children }) => (
    <div className="relative rounded-3xl p-5 bg-white/40 backdrop-blur-xl border border-white/30 shadow-xl overflow-hidden transition hover:scale-[1.03]">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-transparent to-indigo-200 opacity-30 blur-2xl"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#ede9fe] p-6 space-y-6">

      {/* TOP */}
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

      {/* REPORT */}
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
            {progress}%
          </p>

          <div className="mt-3 h-2 bg-white/30 rounded">
            <div
              className="h-2 bg-white rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-3 gap-4">

          <GlassCard>
            <p className="text-sm">Completed</p>
            <p className="text-xl font-bold text-green-600">
              {timeline.filter(t => t.status === "Completed").length}
            </p>
          </GlassCard>

          <GlassCard>
            <p className="text-sm">Due Soon</p>
            <p className="text-xl font-bold text-yellow-600">
              {timeline.filter(t => t.status === "Due Soon").length}
            </p>
          </GlassCard>

          <GlassCard>
            <p className="text-sm">Late</p>
            <p className="text-xl font-bold text-red-600">
              {timeline.filter(t => t.status === "Late").length}
            </p>
          </GlassCard>

        </div>

        {/* TIMELINE */}
        <div className="space-y-4">

          {timeline.map((t, i) => {
            const isLate = t.status === "Late";
            const isSoon = t.status === "Due Soon";
            const isDone = t.status === "Completed";

            return (
              <div
                key={i}
                className={`relative rounded-2xl p-4 border shadow-sm transition hover:shadow-lg
                  ${
                    isLate
                      ? "bg-red-50 border-red-200"
                      : isSoon
                      ? "bg-yellow-50 border-yellow-200"
                      : isDone
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200"
                  }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-transparent to-indigo-200 opacity-20 blur-xl"></div>

                <div className="relative z-10 flex justify-between items-center">

                  <div>
                    <p className="font-semibold">
                      {t.activity}
                    </p>

                    <p className="text-xs text-gray-500">
                      Expected: {t.expected || "-"} | Actual: {t.actual || "-"}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        isLate
                          ? "bg-red-100 text-red-700"
                          : isSoon
                          ? "bg-yellow-100 text-yellow-700"
                          : isDone
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                  >
                    {t.status}
                  </span>

                </div>
              </div>
            );
          })}

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
