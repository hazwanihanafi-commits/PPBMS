import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import SupervisorChecklist from "../../components/SupervisorChecklist";
import SupervisorRemark from "../../components/SupervisorRemark";

export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cqi, setCqi] = useState({});
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD STUDENT DATA
  ========================== */
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
    } catch (err) {
      console.error("Load student error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6 text-center">Loading…</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  const isGraduated = student.status === "Graduated";

  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-8">

      {/* ================= STUDENT INFO ================= */}
      <div className="bg-white rounded-2xl p-6 shadow space-y-1">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">
            {student.student_name}
          </h2>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isGraduated
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {student.status || "Active"}
          </span>
        </div>

        <p><strong>Matric:</strong> {student.student_id}</p>
        <p><strong>Email:</strong> {student.email}</p>
        <p><strong>Programme:</strong> {student.programme}</p>
        <p><strong>Field:</strong> {student.field}</p>
        <p><strong>Department:</strong> {student.department}</p>

        {/* CO-SUPERVISORS */}
        {student.coSupervisors?.length > 0 && (
          <div className="pt-2">
            <strong>Co-Supervisor(s):</strong>
            <ul className="list-disc ml-5 mt-1">
              {student.coSupervisors.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* OVERALL PROGRESS */}
<div className="mt-4">
  <p className="text-sm font-semibold text-gray-800">
    Overall Progress
  </p>

  <p className="text-2xl font-extrabold text-purple-700">
    {student.progressPercent}%
  </p>

  <div className="mt-2 w-full bg-gray-200 h-2 rounded-full">
    <div
      className={`h-2 rounded-full ${
        student.progressPercent < 50
          ? "bg-red-500"
          : student.progressPercent < 80
          ? "bg-yellow-500"
          : "bg-green-500"
      }`}
      style={{ width: `${student.progressPercent}%` }}
    />
  </div>
</div>

      {/* ================= DOCUMENTS ================= */}
      <SupervisorChecklist documents={student.documents || {}} />

      {/* ================= TIMELINE ================= */}
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

      {/* ================= CQI ================= */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <h3 className="font-bold mb-3">🎯 CQI by Assessment</h3>

        {Object.keys(cqi).length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No CQI data available yet.
          </p>
        ) : (
          Object.entries(cqi).map(([assessment, ploData]) => (
            <div key={assessment} className="mb-4">
              <h4 className="font-semibold text-purple-700 mb-2">
                {assessment}
              </h4>

              <div className="flex flex-wrap gap-2">
                {Object.entries(ploData).map(([plo, d]) => {
                  if (!d) return null;
                  const achieved = d.status === "Achieved";

                  return (
                    <span
                      key={plo}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        achieved
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {plo}: Avg {d.average ?? "-"} – {d.status}
                    </span>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= REMARKS ================= */}
      <div className="space-y-4">
        {!isGraduated ? (
          <>
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
          </>
        ) : (
          <p className="text-sm italic text-gray-500">
            CQI remarks are finalised upon graduation.
          </p>
        )}
      </div>

    </div>
  );
}
