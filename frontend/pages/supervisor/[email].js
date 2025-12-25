import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import SupervisorChecklist from "../../components/SupervisorChecklist";

/* ======================
   UI HELPERS
====================== */
function Tabs({ active, setActive }) {
  const Tab = ({ id, label }) => (
    <button
      onClick={() => setActive(id)}
      className={`px-4 py-2 rounded-xl font-semibold ${
        active === id
          ? "bg-purple-600 text-white"
          : "bg-gray-100 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex gap-3 mb-6">
      <Tab id="overview" label="Overview" />
      <Tab id="timeline" label="Timeline" />
      <Tab id="documents" label="Documents" />
      <Tab id="cqi" label="CQI / PLO" />
    </div>
  );
}

function DelayBadges({ timeline }) {
  const count = s => timeline.filter(t => t.status === s).length;

  const Badge = ({ label, value, color }) => (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Badge label="Late" value={count("Late")} color="bg-red-100 text-red-700" />
      <Badge label="Due Soon" value={count("Due Soon")} color="bg-yellow-100 text-yellow-700" />
      <Badge label="On Time" value={count("On Time")} color="bg-blue-100 text-blue-700" />
      <Badge label="Completed" value={count("Completed")} color="bg-green-100 text-green-700" />
    </div>
  );
}

/* ======================
   PAGE
====================== */
export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;
    load();
  }, [email]);

  async function load() {
    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setStudent(data.row);
      setTimeline(data.row.timeline || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  const progress = timeline.length
    ? Math.round(
        (timeline.filter(t => t.status === "Completed").length /
          timeline.length) * 100
      )
    : 0;

  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-6">

      {/* ===== HEADER ===== */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-extrabold mb-2">
          {student.student_name}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 text-sm gap-2">
          <div><strong>Matric:</strong> {student.student_id}</div>
          <div><strong>Email:</strong> {student.email}</div>
          <div><strong>Programme:</strong> {student.programme}</div>
          <div><strong>Field:</strong> {student.field}</div>
          <div><strong>Department:</strong> {student.department}</div>
          <div><strong>Status:</strong> {student.status}</div>
          <div><strong>Main Supervisor:</strong> You</div>
          <div>
            <strong>Co-Supervisor(s):</strong>{" "}
            {student.coSupervisors?.length
              ? student.coSupervisors.join(", ")
              : "None"}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Overall Progress</span>
            <span className="font-semibold text-purple-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 h-3 rounded-full">
            <div
              className="bg-purple-600 h-3 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ===== DELAY SUMMARY ===== */}
      <DelayBadges timeline={timeline} />

      {/* ===== TABS ===== */}
      <Tabs active={activeTab} setActive={setActiveTab} />

      {/* ===== OVERVIEW ===== */}
      {activeTab === "overview" && (
        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-700">
            Supervisor view mirrors student dashboard with additional CQI & PLO
            monitoring and intervention remarks.
          </p>
        </div>
      )}

      {/* ===== DOCUMENTS ===== */}
      {activeTab === "documents" && (
        <div className="bg-white p-6 rounded-2xl shadow">
          <SupervisorChecklist documents={student.documents} />
        </div>
      )}

      {/* ===== TIMELINE ===== */}
      {activeTab === "timeline" && (
        <div className="bg-white p-6 rounded-2xl shadow overflow-x-auto">
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
                <tr key={i} className="border-t">
                  <td className="p-3">{t.activity}</td>
                  <td className="p-3">{t.expected || "-"}</td>
                  <td className="p-3">{t.actual || "-"}</td>
                  <td className="p-3 font-semibold">{t.status}</td>
                  <td className="p-3">{t.remaining_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== CQI / PLO ===== */}
{activeTab === "cqi" && (
  <div className="space-y-6">

    {/* ================= CQI BY ASSESSMENT ================= */}
    <div className="bg-white rounded-2xl p-6 shadow">
      <h3 className="font-bold mb-4">📊 CQI by Assessment</h3>

      {Object.keys(student.cqiByAssessment || {}).length === 0 ? (
        <p className="text-sm italic text-gray-500">
          No CQI data available.
        </p>
      ) : (
        Object.entries(student.cqiByAssessment).map(
          ([assessment, ploData]) => (
            <div key={assessment} className="mb-6">
              <h4 className="font-semibold text-purple-700 mb-2">
                {assessment}
              </h4>

              <div className="flex flex-wrap gap-2">
                {Object.entries(ploData)
                  .sort(([a], [b]) =>
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
          )
        )
      )}
    </div>

    {/* ================= SUPERVISOR INTERVENTION ================= */}
    {Object.keys(student.cqiByAssessment || {}).map(type => (
      <SupervisorRemark
        key={type}
        studentMatric={student.student_id}
        studentEmail={student.email}
        assessmentType={type}
        initialRemark={student.remarksByAssessment?.[type]}
      />
    ))}

    {/* ================= FINAL PLO ================= */}
    <FinalPLOTable finalPLO={student.finalPLO} />

    {/* ================= EXPORT ================= */}
    <div className="bg-white rounded-2xl p-6 shadow">
      <h4 className="font-semibold mb-3">📤 Export</h4>
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-purple-600 text-white rounded-xl">
          Export PDF
        </button>
        <button className="px-4 py-2 bg-gray-200 rounded-xl">
          Export Excel
        </button>
      </div>
    </div>

  </div>
)}
