import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

import SupervisorChecklist from "../../components/SupervisorChecklist";
import SupervisorRemark from "../../components/SupervisorRemark";

/* ===============================
   CHART.JS SETUP
=============================== */
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

/* ===============================
   HELPER: TOTAL PLO AGGREGATION
=============================== */
function computeTotalPLO(cqiByAssessment) {
  let achieved = 0;
  let cqiRequired = 0;

  Object.values(cqiByAssessment).forEach(assessment => {
    Object.values(assessment).forEach(p => {
      if (p.status === "Achieved") achieved++;
      else cqiRequired++;
    });
  });

  return { achieved, cqiRequired };
}

export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

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
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const json = await res.json();

      setStudent(json.row);
      setTimeline(json.row.timeline || []);
      setCqi(json.row.cqiByAssessment || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  if (!student) {
    return <div className="p-6">Student not found</div>;
  }

  /* ===============================
     TOTAL PLO CHART DATA
  =============================== */
  const totalPLO = computeTotalPLO(cqi);

  const totalPLOChartData = {
    labels: ["Achieved", "CQI Required"],
    datasets: [
      {
        label: "Total PLO Status",
        data: [totalPLO.achieved, totalPLO.cqiRequired],
        backgroundColor: ["#22c55e", "#ef4444"],
        borderRadius: 6
      }
    ]
  };

  const totalPLOChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-8">

      {/* ===============================
         STUDENT INFO
      =============================== */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <h2 className="text-xl font-bold mb-2">
          {student.student_name}
        </h2>
        <p><strong>Matric:</strong> {student.student_id}</p>
        <p><strong>Email:</strong> {student.email}</p>
        <p><strong>Programme:</strong> {student.programme}</p>
        <p><strong>Field:</strong> {student.field}</p>
        <p><strong>Department:</strong> {student.department}</p>
      </div>

      {/* ===============================
         DOCUMENT CHECKLIST
      =============================== */}
      <SupervisorChecklist documents={student.documents || {}} />

      {/* ===============================
         TIMELINE
      =============================== */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <h3 className="font-bold mb-4">
          📅 Expected vs Actual Timeline
        </h3>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-100">
              <th className="p-3 text-left">Activity</th>
              <th className="p-3">Expected</th>
              <th className="p-3">Actual</th>
              <th className="p-3">Status</th>
              <th className="p-3">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((t, i) => {
              const delayed =
                !t.actual &&
                t.remaining_days < 0 &&
                t.status !== "Completed";

              return (
                <tr key={i} className="border-t">
                  <td className="p-3">{t.activity}</td>
                  <td className="p-3">{t.expected || "-"}</td>
                  <td className="p-3">{t.actual || "-"}</td>
                  <td
                    className={`p-3 font-medium ${
                      t.status === "Completed"
                        ? "text-green-600"
                        : delayed
                        ? "text-red-600"
                        : ""
                    }`}
                  >
                    {delayed ? "Delayed" : t.status}
                  </td>
                  <td className="p-3">
                    {t.remaining_days}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===============================
         CQI BY ASSESSMENT
      =============================== */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <h3 className="font-bold mb-3">
          🎯 CQI by Assessment
        </h3>

        {Object.keys(cqi).length === 0 ? (
          <p className="text-sm text-gray-500">
            No CQI data available
          </p>
        ) : (
          Object.entries(cqi).map(([assessment, ploData]) => (
            <div key={assessment} className="mb-4">
              <h4 className="font-semibold text-purple-700 mb-2">
                {assessment}
              </h4>

              <div className="flex flex-wrap gap-2">
                {Object.entries(ploData).map(([plo, d]) => (
                  <span
                    key={plo}
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        d.status === "Achieved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                  >
                    {plo}: Avg {d.average} – {d.status}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}

        <p className="text-xs text-gray-500 mt-3">
          Scale-based CQI: Achieved ≥ 3.0 | CQI Required &lt; 3.0
        </p>
      </div>

      {/* ===============================
         TOTAL PLO BAR CHART
      =============================== */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <h3 className="font-bold mb-4">
          📈 Total PLO Achievement (All Assessments)
        </h3>

        {totalPLO.achieved + totalPLO.cqiRequired === 0 ? (
          <p className="text-sm text-gray-500">
            No CQI data available
          </p>
        ) : (
          <Bar
            data={totalPLOChartData}
            options={totalPLOChartOptions}
            height={200}
          />
        )}

        <p className="text-xs text-gray-500 mt-3">
          Includes TRX500 & VIVA
        </p>
      </div>

      {/* ===============================
         SUPERVISOR REMARKS
      =============================== */}
      <div className="space-y-4">
        <SupervisorRemark
          studentMatric={student.student_id}
          studentEmail={student.email}
          assessmentType="TRX500"
        />

        <SupervisorRemark
          studentMatric={student.student_id}
          studentEmail={student.email}
          assessmentType="VIVA"
        />
      </div>

    </div>
  );
}
