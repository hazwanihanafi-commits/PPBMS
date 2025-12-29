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

  /* ================= LOAD STUDENT ================= */
  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  async function loadStudent() {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("ppbms_token")
          : "";

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
      console.error("Load student error:", err);
    } finally {
      setLoading(false);
    }
  }

  /* ================= GUARDS ================= */
  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  /* ================= DATA NORMALISATION ================= */

  const mainSupervisor =
  student.mainSupervisor ||
  student.supervisor ||
  student["Main Supervisor"] ||
  student["Main Supervisor Name"] ||
  student["Supervisor Name"] ||
  student.supervisor_name ||
  student.supervisorEmail ||
  student["Main Supervisor Email"] ||
  null;


  const completed = timeline.filter(t => t.status === "Completed").length;
  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  const nextMilestone = timeline.find(
    t => t.status !== "Completed" && t.remaining_days >= 0
  );

  const hasCQIAlert =
    student.status !== "Graduated" &&
    (
      timeline.some(t => t.status === "Late" || t.status === "Due Soon") ||
      Object.values(cqi || {}).some(a =>
        a && typeof a === "object"
          ? Object.values(a).some(p => p?.status !== "Achieved")
          : false
      )
    );

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-6">

      {/* BACK */}
      <button
        onClick={() => router.push("/supervisor")}
        className="text-purple-700 font-medium hover:underline"
      >
        ← Back to Supervisor Dashboard
      </button>

      {/* ================= HERO ================= */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl shadow p-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{student.student_name}</h1>
          <span className="px-3 py-1 rounded-full text-xs bg-white/20">
            {student.status}
          </span>
        </div>

        <p className="text-purple-100">
          {student.programme} · {student.department}
        </p>

        <div className="mt-4 flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <p className="text-sm">Overall Progress</p>
            <p className="text-3xl font-extrabold">{progress}%</p>
          </div>

          {nextMilestone && student.status !== "Graduated" && (
            <div className="bg-white text-gray-800 rounded-xl p-4 shadow">
              <p className="text-xs uppercase font-semibold text-gray-500">
                Next Milestone
              </p>
              <p className="font-bold">{nextMilestone.activity}</p>
              <p className="text-sm">
                Due in {nextMilestone.remaining_days} days
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 bg-purple-300/30 h-3 rounded-full">
          <div
            className="bg-white h-3 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ================= CQI ALERT ================= */}
      {hasCQIAlert && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
          <p className="font-bold text-red-700">
            🚨 CQI Attention Required
          </p>
          <p className="text-sm text-red-600">
            One or more milestones or PLOs require intervention.
          </p>
        </div>
      )}

      {/* ================= TABS ================= */}
      <div className="flex gap-2 flex-wrap">
        {[
          ["overview", "📊 Overview"],
          ["documents", "📁 Documents"],
          ["timeline", "📅 Timeline"],
          ["cqi", "🎯 CQI & PLO"],
          ["remarks", "📝 Supervisor Remarks"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-full font-semibold ${
              activeTab === id
                ? "bg-purple-600 text-white"
                : "bg-purple-100 text-purple-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ================= OVERVIEW ================= */}
      {activeTab === "overview" && (
        <div className="bg-white rounded-2xl shadow p-6 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <p><strong>Matric:</strong> {student.student_id}</p>
            <p><strong>Email:</strong> {student.email}</p>
            <p><strong>Programme:</strong> {student.programme}</p>
            <p><strong>Status:</strong> {student.status}</p>

            <p className="md:col-span-2">
              <strong>Field:</strong> {student.field || "-"}
            </p>
            <p className="md:col-span-2">
              <strong>Department:</strong> {student.department || "-"}
            </p>
            <p className="md:col-span-2">
              <strong>Main Supervisor:</strong>{" "}
              {mainSupervisor ? (
                mainSupervisor
              ) : (
                <span className="italic text-gray-400">
                  Not recorded / archived
                </span>
              )}
            </p>
            <p className="md:col-span-2">
              <strong>Co-Supervisor(s):</strong>{" "}
              {student.coSupervisors?.length
                ? student.coSupervisors.join(", ")
                : "-"}
            </p>
          </div>
        </div>
      )}

      {/* ================= DOCUMENTS ================= */}
      {activeTab === "documents" && (
        <SupervisorChecklist documents={student.documents || {}} />
      )}

      {/* ================= TIMELINE ================= */}
      {activeTab === "timeline" && (
        <div className="bg-white rounded-2xl shadow p-6">
          {timeline.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No timeline data available.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-purple-100">
                <tr>
                  <th className="p-3 text-left">Activity</th>
                  <th className="p-3">Expected</th>
                  <th className="p-3">Actual</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((t, i) => (
                  <tr
                    key={i}
                    className={`border-t ${
                      t.status === "Late"
                        ? "bg-red-50"
                        : t.status === "Due Soon"
                        ? "bg-orange-50"
                        : ""
                    }`}
                  >
                    <td className="p-3">{t.activity}</td>
                    <td className="p-3">{t.expected || "-"}</td>
                    <td className="p-3">{t.actual || "-"}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          t.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : t.status === "On Time"
                            ? "bg-blue-100 text-blue-700"
                            : t.status === "Due Soon"
                            ? "bg-orange-100 text-orange-700"
                            : t.status === "Late"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td
                      className={`p-3 ${
                        t.remaining_days <= 30 && t.remaining_days > 0
                          ? "text-orange-600 font-semibold"
                          : t.remaining_days <= 0
                          ? "text-red-600 font-semibold"
                          : ""
                      }`}
                    >
                      {t.remaining_days}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ================= CQI & PLO ================= */}
      {activeTab === "cqi" && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h3 className="font-bold text-lg">🎯 CQI by Assessment</h3>

          {Object.keys(cqi || {}).length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No CQI / PLO data available.
            </p>
          ) : (
            Object.entries(cqi).map(([assessment, ploData]) => (
              <div key={assessment} className="border rounded-xl p-4">
                <h4 className="font-semibold text-purple-700 mb-2">
                  {assessment}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ploData || {})
                    .sort(
                      ([a], [b]) =>
                        parseInt(a.replace("PLO", "")) -
                        parseInt(b.replace("PLO", ""))
                    )
                    .map(([plo, d]) => (
                      <span
                        key={plo}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          d.status === "Achieved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {plo}: Avg {d.average ?? "-"} – {d.status}
                      </span>
                    ))}
                </div>
              </div>
            ))
          )}

          <div className="mt-6">
            <h3 className="font-bold mb-2">
              📊 Final PLO Attainment
            </h3>

            {student.status === "Graduated" && !student.finalPLO ? (
              <p className="text-sm text-gray-500 italic">
                Final PLO attainment was achieved and validated at graduation.
                Detailed records are archived.
              </p>
            ) : (
              <FinalPLOTable finalPLO={student.finalPLO} />
            )}
          </div>
        </div>
      )}

      {/* ================= REMARKS ================= */}
      {activeTab === "remarks" && (
        <SupervisorRemark
          studentMatric={student.student_id}
          studentEmail={student.email}
          assessmentType="TRX500"
          initialRemark={student.remarksByAssessment?.TRX500}
        />
      )}
    </div>
  );
}
