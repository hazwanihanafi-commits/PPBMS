import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import SupervisorChecklist from "../../components/SupervisorChecklist";
import SupervisorRemark from "../../components/SupervisorRemark";
import FinalPLOTable from "../../components/FinalPLOTable";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

  async function exportPDF() {
    const canvas = await html2canvas(reportRef.current);
    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(img, "PNG", 0, 0, 210, 295);
    pdf.save(`${student.student_name}_report.pdf`);
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

  /* ================= GLASS CARD ================= */
  const GlassCard = ({ children }) => (
    <div className="relative p-5 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/30 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-transparent to-indigo-200 opacity-20 blur-xl"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );

  /* ================= LAYOUT ================= */

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#eef2ff] to-white">

      {/* SIDEBAR */}
      <div className="w-64 bg-white shadow-lg p-4 space-y-3">

        <h2 className="font-bold text-purple-700 text-lg">PPBMS</h2>

        {[
          ["overview", "Overview"],
          ["documents", "Documents"],
          ["timeline", "Timeline"],
          ["cqi", "CQI & PLO"],
          ["remarks", "Remarks"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`block w-full text-left px-4 py-2 rounded-xl ${
              activeTab === id
                ? "bg-purple-600 text-white"
                : "hover:bg-purple-100"
            }`}
          >
            {label}
          </button>
        ))}

        <button
          onClick={() => router.push("/supervisor")}
          className="mt-6 text-sm text-purple-600 hover:underline"
        >
          ← Back
        </button>

      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6 space-y-6">

        {/* EXPORT */}
        <div className="flex justify-end">
          <button
            onClick={exportPDF}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl shadow"
          >
            Export PDF
          </button>
        </div>

        {/* REPORT AREA ONLY */}
        <div ref={reportRef} className="space-y-6">

          {/* HERO */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white p-6 rounded-2xl">
            <h1 className="text-2xl font-bold">
              {student.student_name}
            </h1>
            <p className="text-sm text-purple-100">
              {student.programme}
            </p>

            <p className="text-3xl mt-2 font-bold">{progress}%</p>

            <div className="h-2 bg-white/30 mt-2 rounded">
              <div
                className="h-2 bg-white rounded"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">

              <GlassCard>
                <p><strong>Email:</strong> {student.email}</p>
                <p><strong>Matric:</strong> {student.student_id}</p>
              </GlassCard>

              {/* 📊 ANALYTICS */}
              <div className="grid grid-cols-3 gap-4">

                <GlassCard>
                  <p className="text-sm">Completed</p>
                  <div className="h-2 bg-gray-200 rounded mt-2">
                    <div
                      className="h-2 bg-green-500 rounded"
                      style={{ width: `${(completed / timeline.length) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 font-bold">{completed}</p>
                </GlassCard>

                <GlassCard>
                  <p className="text-sm">Due Soon</p>
                  <div className="h-2 bg-gray-200 rounded mt-2">
                    <div
                      className="h-2 bg-yellow-500 rounded"
                      style={{ width: `${(soon / timeline.length) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 font-bold">{soon}</p>
                </GlassCard>

                <GlassCard>
                  <p className="text-sm">Late</p>
                  <div className="h-2 bg-gray-200 rounded mt-2">
                    <div
                      className="h-2 bg-red-500 rounded"
                      style={{ width: `${(late / timeline.length) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 font-bold">{late}</p>
                </GlassCard>

              </div>
            </div>
          )}

          {/* DOCUMENTS */}
          {activeTab === "documents" && (
            <SupervisorChecklist documents={student.documents || {}} />
          )}

          {/* 🔥 TIMELINE */}
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
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{t.activity}</p>
                      <p className="text-xs text-gray-500">
                        {t.expected} → {t.actual || "-"}
                      </p>
                    </div>

                    <span className="text-xs font-bold">
                      {t.status}
                    </span>
                  </div>
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
    </div>
  );
}
