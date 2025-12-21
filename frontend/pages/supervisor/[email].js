import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import SupervisorChecklist from "../../components/SupervisorChecklist";
import SupervisorRemark from "../../components/SupervisorRemark";
import { aggregateOverallPLO } from "../../utils/cqiSummary";
import { generateCQINarrative } from "../../utils/cqiNarrative";
import PLOAverageChart from "../../components/PLOAverageChart";

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
      if (typeof window === "undefined") return;
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
    } catch (e) {
      console.error("Load student error:", e);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     SAFE CQI DERIVED DATA
  ========================== */

  const ploSummary = useMemo(() => {
    if (!cqi || Object.keys(cqi).length === 0) return null;
    try {
      return aggregateOverallPLO(cqi);
    } catch (e) {
      console.error("aggregateOverallPLO error:", e);
      return null;
    }
  }, [cqi]);

  const cqiNarrative = useMemo(() => {
    if (!ploSummary) return "";
    try {
      return generateCQINarrative(ploSummary);
    } catch (e) {
      console.error("generateCQINarrative error:", e);
      return "";
    }
  }, [ploSummary]);

  /* ========================= */

  if (loading) {
    return <div className="p-6 text-center">Loading…</div>;
  }

  if (!student) {
    return <div className="p-6">Student not found</div>;
  }

  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-8">

      {/* STUDENT INFO */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <h2 className="text-xl font-bold">{student.student_name}</h2>
        <p><strong>Matric:</strong> {student.student_id}</p>
        <p><strong>Email:</strong> {student.email}</p>
        <p><strong>Programme:</strong> {student.programme}</p>
        <p><strong>Field:</strong> {student.field}</p>
        <p><strong>Department:</strong> {student.department}</p>
      </div>

      {/* DOCUMENTS */}
      <SupervisorChecklist documents={student.documents || {}} />

      {/* TIMELINE */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <h3 className="font-bold mb-4">📅 Expected vs Actual Timeline</h3>
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
                <td className="p-3">{t.status}</td>
                <td className="p-3">{t.remaining_days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CQI BY ASSESSMENT */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <h3 className="font-bold mb-3">🎯 CQI by Assessment</h3>

        {Object.entries(cqi).length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No CQI data available yet.
          </p>
        ) : (
          Object.entries(cqi).map(([assessment, ploData]) => (
            <div key={assessment} className="mb-4">
              <h4 className="font-semibold text-purple-700">{assessment}</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ploData).map(([plo, d]) => (
                  <span
                    key={plo}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
      </div>

      {/* OVERALL PLO PERFORMANCE */}
      <div className="bg-white rounded-2xl p-6 shadow space-y-4">
        <h3 className="font-bold text-lg">
          📈 Overall PLO Performance (All Assessments)
        </h3>

        {ploSummary ? (
          <>
            <PLOAverageChart ploSummary={ploSummary} />

            <div className="bg-gray-50 border rounded-xl p-4 text-sm text-gray-700">
              <strong>CQI Narrative:</strong>
              <p className="mt-2">{cqiNarrative}</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Overall CQI summary not available yet.
          </p>
        )}
      </div>

      {/* REMARKS */}
      <div className="space-y-4">
        <SupervisorRemark
          studentMatric={student.student_id}
          studentEmail={student.email}
          assessmentType="TRX500"
          initialRemark={student.remarksByAssessment?.TRX500}
        />

        <SupervisorRemark
          studentMatric={student.student_id}
          studentEmail={student.email}
          assessmentType="VIVA"
          initialRemark={student.remarksByAssessment?.VIVA}
        />
      </div>

    </div>
  );
}
