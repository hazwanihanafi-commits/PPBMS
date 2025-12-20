import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import StudentChecklist from "../../components/StudentChecklist";

export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cqi, setCqi] = useState({});
  const [remarks, setRemarks] = useState("");
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setStudent(data.row);
      setTimeline(data.row.timeline || []);
      setCqi(data.row.cqiByAssessment || {});
      setRemarks(data.row.remarks || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Loading student data…
      </div>
    );
  }

  if (!student) {
    return <div className="p-6">Student not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 space-y-8">

      {/* ===============================
          HEADER
      =============================== */}
      <h1 className="text-3xl font-extrabold text-gray-900">
        👩‍🏫 Supervisor View
      </h1>

      {/* ===============================
          STUDENT PROFILE
      =============================== */}
      <div className="bg-white shadow-card rounded-2xl p-6 border">
        <h2 className="text-xl font-bold mb-3">
          {student.student_name}
        </h2>

        <p><strong>Matric:</strong> {student.student_id}</p>
        <p><strong>Email:</strong> {student.email}</p>
        <p><strong>Programme:</strong> {student.programme}</p>
        <p><strong>Field:</strong> {student.field}</p>
        <p><strong>Department:</strong> {student.department}</p>
      </div>

      {/* ===============================
          DOCUMENT CHECKLIST (MIRROR)
      =============================== */}
      <div>
        <StudentChecklist
          initialDocuments={student.documents}
          readOnly   // 👈 IMPORTANT
        />
      </div>

      {/* ===============================
          CQI SECTION
      =============================== */}
      <div className="bg-white shadow-card rounded-2xl p-6 border">
        <h3 className="text-lg font-bold mb-3">
          🎯 CQI by Assessment (TRX500)
        </h3>

        {Object.keys(cqi).length === 0 ? (
          <p className="text-gray-500 text-sm">
            No CQI data available
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(cqi).map(([plo, data]) => {
              const achieved = data.status === "Achieved";

              return (
                <span
                  key={plo}
                  className={`px-3 py-1 rounded-full text-xs font-semibold
                    ${
                      achieved
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                >
                  {plo}: Avg {data.average} – {data.status}
                </span>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3">
          Scale-based CQI: Achieved ≥ 3.0 | CQI Required &lt; 3.0
        </p>
      </div>

      {/* ===============================
          EXPECTED vs ACTUAL TIMELINE (READ-ONLY)
      =============================== */}
      <div className="bg-white shadow-card rounded-2xl p-6 border">
        <h3 className="text-lg font-bold mb-4">
          📅 Expected vs Actual Timeline
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-50 text-purple-700">
                <th className="p-3 text-left">Activity</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Actual</th>
                <th className="p-3">Status</th>
                <th className="p-3">Remaining</th>
              </tr>
            </thead>

            <tbody>
              {timeline.map((t, i) => {
                const isLate =
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
                          : isLate
                          ? "text-red-600"
                          : "text-gray-700"
                      }`}
                    >
                      {isLate ? "Delayed" : t.status}
                    </td>

                    <td
                      className={`p-3 ${
                        isLate ? "text-red-600 font-semibold" : ""
                      }`}
                    >
                      {t.remaining_days}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===============================
          SUPERVISOR REMARKS
      =============================== */}
      <div className="bg-white shadow-card rounded-2xl p-6 border">
        <h3 className="text-lg font-bold mb-2">
          🛠 Supervisor Intervention & Remarks
        </h3>

        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={4}
          placeholder="Enter intervention plan or supervisor remarks…"
          className="w-full border rounded-lg p-2 text-sm"
        />
      </div>
    </div>
  );
}
