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

  const completed = timeline.filter(t => t.status === "Completed").length;
  const progress = timeline.length
    ? Math.round((completed / timeline.length) * 100)
    : 0;

  const nextMilestone = timeline.find(
    t => t.status !== "Completed" && t.remaining_days >= 0
  );

  const hasCQIAlert =
    timeline.some(t => t.status === "Late" || t.status === "Due Soon") ||
    Object.values(cqi || {}).some(a =>
      Object.values(a || {}).some(p => p?.status !== "Achieved")
    );

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#ede9fe] p-6 space-y-6">

      {/* BACK */}
      <button
        onClick={() => router.push("/supervisor")}
        className="text-purple-700 font-medium hover:underline"
      >
        ← Back to Supervisor Dashboard
      </button>

      {/* HERO */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 text-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-semibold">{student.student_name}</h1>
        <p className="text-sm text-purple-100">
          {student.programme} · {student.department}
        </p>

        <div className="mt-4 flex justify-between">
          <div>
            <p className="text-sm">Overall Progress</p>
            <p className="text-3xl font-bold">{progress}%</p>
          </div>

          {nextMilestone && (
            <div className="bg-white text-gray-800 rounded-xl p-4 shadow">
              <p className="text-xs font-semibold">Next Milestone</p>
              <p>{nextMilestone.activity}</p>
              <p className="text-sm">
                Due in {nextMilestone.remaining_days} days
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 h-2 bg-white/30 rounded">
          <div
            className="h-2 bg-white rounded"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ALERT */}
      {hasCQIAlert && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
          <p className="font-semibold text-red-700">
            CQI Attention Required
          </p>
          <p className="text-sm text-red-600">
            Intervention required based on timeline or PLO.
          </p>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">
        {["overview", "documents", "timeline", "cqi", "remarks"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full font-semibold ${
              activeTab === tab
                ? "bg-purple-600 text-white"
                : "bg-white/60 backdrop-blur"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* OVERVIEW + ANALYTICS */}
      {activeTab === "overview" && (
        <div className="space-y-6">

          {/* INFO */}
          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow">
            <h3 className="font-semibold mb-3">Student Information</h3>

            <p><strong>Matric:</strong> {student.student_id}</p>
            <p><strong>Email:</strong> {student.email}</p>
            <p><strong>Main Supervisor:</strong> {mainSupervisorName}</p>
          </div>

          {/* ANALYTICS */}
          <div className="grid md:grid-cols-3 gap-6">

            {/* DISTRIBUTION */}
            <div className="bg-white/70 backdrop-blur p-5 rounded-2xl shadow">
              <h3 className="font-semibold mb-3">Timeline Status</h3>

              {["Completed","On Time","Due Soon","Late"].map(status => {
                const count = timeline.filter(t => t.status === status).length;
                const percent = timeline.length ? (count / timeline.length) * 100 : 0;

                const color =
                  status === "Completed"
                    ? "bg-green-500"
                    : status === "On Time"
                    ? "bg-blue-500"
                    : status === "Due Soon"
                    ? "bg-yellow-500"
                    : "bg-red-500";

                return (
                  <div key={status} className="mb-2">
                    <div className="flex justify-between text-sm">
                      <span>{status}</span>
                      <span>{count}</span>
                    </div>

                    <div className="h-2 bg-gray-200 rounded mt-1">
                      <div
                        className={`h-2 rounded ${color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RISK */}
            <div className="bg-white/70 backdrop-blur p-5 rounded-2xl shadow">
              <h3 className="font-semibold mb-3">Risk Assessment</h3>
              <p className={hasCQIAlert ? "text-red-600" : "text-green-600"}>
                {hasCQIAlert
                  ? "Intervention Required"
                  : "On Track"}
              </p>
            </div>

            {/* PROGRESS */}
            <div className="bg-white/70 backdrop-blur p-5 rounded-2xl shadow">
              <h3 className="font-semibold mb-3">Completion Rate</h3>
              <p className="text-2xl font-bold text-purple-700">{progress}%</p>

              <div className="h-2 bg-gray-200 rounded mt-2">
                <div
                  className="bg-purple-600 h-2 rounded"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DOCUMENTS */}
      {activeTab === "documents" && (
        <SupervisorChecklist documents={student.documents || {}} />
      )}

      {/* TIMELINE */}
      {activeTab === "timeline" && (
        <div className="bg-white rounded-2xl shadow p-6">
          {timeline.map((t, i) => (
            <p key={i} className="text-sm border-b py-2">
              {t.activity} — {t.status}
            </p>
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

      {/* FOOTER */}
      <footer className="text-center text-xs text-gray-400 py-6 border-t mt-10">
        © 2026 PPBMS · Universiti Sains Malaysia  
        <br />
        Developed by <span className="font-medium text-gray-600">Hazwani Ahmad Yusof</span> (2025)
      </footer>

    </div>
  );
}
