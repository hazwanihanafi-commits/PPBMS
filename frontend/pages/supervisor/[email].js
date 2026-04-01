import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import SupervisorChecklist from "../../components/SupervisorChecklist";
import SupervisorRemark from "../../components/SupervisorRemark";
import FinalPLOTable from "../../components/FinalPLOTable";

export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

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

  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  /* ================= DATA ================= */

  const mainSupervisorName =
    student.mainSupervisor ||
    student.supervisor ||
    student.main_supervisor ||
    "-";

  const mainSupervisorEmail =
    student.mainSupervisorEmail ||
    student.main_supervisor_email ||
    student.supervisor_email ||
    "-";

  const completed = timeline.filter(t => t.status === "Completed").length;
  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  const hasCQIAlert =
    student.status !== "Graduated" &&
    (
      timeline.some(t => t.status === "Late" || t.status === "Due Soon") ||
      Object.values(cqi || {}).some(a =>
        Object.values(a || {}).some(p => p?.status !== "Achieved")
      )
    );

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-6">

      {/* BACK */}
      <button
        onClick={() => router.push("/supervisor")}
        className="text-purple-700 hover:underline"
      >
        ← Back
      </button>

      {/* HERO */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold">{student.student_name}</h1>
        <p className="text-purple-100 text-sm">
          {student.programme} · {student.department}
        </p>

        <p className="mt-3 text-3xl font-bold">{progress}%</p>

        <div className="mt-3 h-3 bg-white/30 rounded-full">
          <div
            className="h-3 bg-white rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ALERT */}
      {hasCQIAlert && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
          <p className="font-bold text-red-700">
            🚨 CQI Attention Required
          </p>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">
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
            className={`px-4 py-2 rounded-full ${
              activeTab === id
                ? "bg-purple-600 text-white"
                : "bg-purple-100 text-purple-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="bg-white rounded-2xl shadow p-6 text-sm space-y-2">
          <p><strong>Matric:</strong> {student.student_id}</p>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Programme:</strong> {student.programme}</p>
          <p><strong>Main Supervisor:</strong> {mainSupervisorName}</p>
          <p><strong>Supervisor Email:</strong> {mainSupervisorEmail}</p>
          <p>
            <strong>Co-Supervisors:</strong>{" "}
            {student.coSupervisors?.join(", ") || "-"}
          </p>
        </div>
      )}

      {/* DOCUMENTS */}
      {activeTab === "documents" && (
        <SupervisorChecklist documents={student.documents || {}} />
      )}

      {/* 🔥 TIMELINE */}
      {activeTab === "timeline" && (
        <div className="space-y-4">

          {timeline.map((t, i) => {
            const isLate = t.status === "Late";
            const isSoon = t.status === "Due Soon";
            const isDone = t.status === "Completed";

            return (
              <div
                key={i}
                className={`rounded-xl p-4 border shadow-sm
                  ${
                    isLate
                      ? "bg-red-50 border-red-300"
                      : isSoon
                      ? "bg-yellow-50 border-yellow-300"
                      : isDone
                      ? "bg-green-50 border-green-300"
                      : "bg-white"
                  }`}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{t.activity}</p>
                    <p className="text-xs text-gray-500">
                      Expected: {t.expected || "-"} | Actual: {t.actual || "-"}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-1 text-xs rounded
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
      )}

      {/* CQI */}
      {activeTab === "cqi" && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          {Object.entries(cqi || {}).map(([assessment, ploData]) => (
            <div key={assessment}>
              <h4 className="font-semibold text-purple-700 mb-2">
                {assessment}
              </h4>

              <div className="flex flex-wrap gap-2">
                {Object.entries(ploData || {}).map(([plo, d]) => (
                  <span
                    key={plo}
                    className={`px-3 py-1 rounded-full text-xs
                      ${
                        d.status === "Achieved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                  >
                    {plo}: {d.status}
                  </span>
                ))}
              </div>
            </div>
          ))}

          <FinalPLOTable finalPLO={student.finalPLO} />
        </div>
      )}

      {/* REMARKS */}
      {activeTab === "remarks" && (
        <div className="space-y-4">
          {Object.entries(student.remarksByAssessment || {}).map(
            ([assessmentType, remark]) => (
              <SupervisorRemark
                key={assessmentType}
                studentMatric={student.student_id}
                studentEmail={student.email}
                assessmentType={assessmentType}
                initialRemark={remark}
              />
            )
          )}
        </div>
      )}

      {/* FOOTER */}
      <footer className="text-center text-xs text-gray-400 pt-6">
        © 2026 PPBMS · Universiti Sains Malaysia  
        <br />
        Developed by Hazwani Ahmad Yusof (2025)
      </footer>

    </div>
  );
}
