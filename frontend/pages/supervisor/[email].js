import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ================= UI CARD ================= */
const Card = ({ children }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white rounded-2xl p-5 shadow-sm border"
  >
    {children}
  </motion.div>
);

/* ================= PAGE ================= */
export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [cqi, setCqi] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */
  useEffect(() => {
    if (!email) return;
    loadData();
  }, [email]);

  async function loadData() {
    try {
      const token = localStorage.getItem("ppbms_token");

      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      const s = data.row || data.student || data;

      setStudent(s || {});
      setTimeline(Array.isArray(s?.timeline) ? s.timeline : []);
      setRemarks(
        Array.isArray(s?.remarksByAssessment)
          ? s.remarksByAssessment
          : []
      );
      setCqi(s?.cqiByAssessment || {});
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  /* ================= LOADING ================= */
  if (loading) return <div className="p-6">Loading...</div>;
  if (!student) return <div className="p-6">No student data</div>;

  /* ================= CALCULATIONS ================= */
  const completed = timeline.filter(
    (t) => t.status?.toLowerCase() === "completed"
  ).length;

  const delayed = timeline.filter(
    (t) =>
      t.status?.toLowerCase() === "late" ||
      t.status?.toUpperCase() === "AT_RISK"
  ).length;

  const isGraduated =
    (student.status || "").toLowerCase() === "graduated";

  const risk =
    isGraduated
      ? "GRADUATED"
      : delayed > 2
      ? "HIGH RISK"
      : delayed > 0
      ? "MODERATE RISK"
      : "LOW RISK";

  /* ================= SAVE REMARK ================= */
  async function saveRemark(item) {
    try {
      const token = localStorage.getItem("ppbms_token");

      await fetch(`${API_BASE}/api/supervisorRemark/remark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentEmail: student.email,
          studentMatric: student.student_id,
          assessmentType: item.assessmentType,
          assessmentInstance: item.assessmentInstance,
          remark: item.remark,
        }),
      });

      alert("Saved ✅");
      loadData();
    } catch {
      alert("Error ❌");
    }
  }

  /* ================= UI ================= */
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <div className="w-60 bg-[#0f172a] text-white p-5">
        <h2 className="font-bold mb-6">PPBMS</h2>

        {["overview", "timeline", "documents", "remarks", "cqi"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`block w-full text-left mb-3 px-3 py-2 rounded-lg ${
                activeTab === tab
                  ? "bg-purple-600"
                  : "hover:bg-gray-700"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          )
        )}
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6 space-y-6">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-3xl">
          <h1 className="text-2xl font-bold">
            Student Monitoring Dashboard
          </h1>
          <p className="text-sm">
            Track postgraduate progress & supervision
          </p>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          <Card>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {completed}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-gray-500">Delayed</p>
            <p className="text-2xl font-bold text-orange-600">
              {delayed}
            </p>
          </Card>

          {!isGraduated && (
            <Card>
              <p className="text-sm text-gray-500">Risk</p>
              <p className="text-2xl font-bold text-red-600">
                {risk}
              </p>
            </Card>
          )}

          <Card>
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-2xl font-bold text-blue-600">
              {student.status || "-"}
            </p>
          </Card>
        </div>

        {/* GRAPH */}
        <Card>
          <h3 className="font-semibold mb-4">Status Analytics</h3>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[
                { name: "Completed", value: completed },
                { name: "Delayed", value: delayed },
              ]}
            >
              <XAxis dataKey="name" />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* TIMELINE */}
        {activeTab === "timeline" && (
          <Card>
            <h3 className="mb-4 font-semibold">
              Milestone Timeline ({timeline.length})
            </h3>

            <div className="flex gap-6 overflow-x-auto">
              {timeline.map((t, i) => (
                <div key={i} className="text-center min-w-[120px]">
                  <div
                    className={`w-8 h-8 mx-auto rounded-full ${
                      t.status === "completed"
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  ></div>
                  <p className="text-xs mt-2">{t.activity}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <Card>
            <h3 className="mb-4 font-semibold">Documents</h3>

            {(student.documents || []).map((d, i) => (
              <div key={i} className="border p-3 rounded mb-2">
                <p>{d.name}</p>
                <p className="text-xs text-gray-500">{d.status}</p>
              </div>
            ))}
          </Card>
        )}

        {/* REMARKS */}
        {activeTab === "remarks" && (
          <Card>
            <h3 className="mb-4 font-semibold">Remarks</h3>

            {remarks.map((r, i) => (
              <div key={i} className="mb-4">
                <p className="font-semibold">
                  {r.assessmentInstance}
                </p>

                <textarea
                  value={r.remark || ""}
                  onChange={(e) => {
                    const updated = [...remarks];
                    updated[i].remark = e.target.value;
                    setRemarks(updated);
                  }}
                  className="w-full border p-3 rounded mt-2"
                />

                <button
                  onClick={() => saveRemark(r)}
                  className="mt-2 px-4 py-2 bg-purple-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            ))}
          </Card>
        )}

        {/* CQI */}
        {activeTab === "cqi" && (
          <Card>
            <h3 className="mb-4 font-semibold">CQI Analytics</h3>

            <pre className="text-sm">
              {JSON.stringify(cqi, null, 2)}
            </pre>
          </Card>
        )}

      </div>
    </div>
  );
}
