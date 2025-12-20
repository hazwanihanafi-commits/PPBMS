import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import SupervisorChecklist from "../../components/SupervisorChecklist";

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
          headers: { Authorization: `Bearer ${token}` },
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
    <div className="min-h-screen bg-purple-50 p-6 space-y-8">

      {/* STUDENT INFO */}
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

      {/* DOCUMENT CHECKLIST (SUPERVISOR VIEW) */}
      <SupervisorChecklist documents={student.documents || {}} />

      {/* TIMELINE */}
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

      {/* CQI — AFTER TIMELINE */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <h3 className="font-bold mb-3">
          🎯 CQI by Assessment (TRX500)
        </h3>

        <div className="flex flex-wrap gap-2">
          {Object.entries(cqi).map(([plo, d]) => (
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

        <p className="text-xs text-gray-500 mt-3">
          Scale-based CQI: Achieved ≥ 3.0 | CQI Required &lt; 3.0
        </p>
      </div>

{/* ===============================
    CQI BY ASSESSMENT (TRX500)
=============================== */}
<div className="bg-white rounded-xl p-4 mt-6">
  <h3 className="font-semibold mb-3">
    🎯 CQI by Assessment (TRX500)
  </h3>

  {Object.keys(cqi).length === 0 ? (
    <p className="text-sm text-gray-500">
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



      {/* SUPERVISOR REMARKS */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <h3 className="font-bold mb-2">
          🛠 Supervisor Intervention & Remarks
        </h3>

        <textarea
          rows={4}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="w-full border rounded p-2 text-sm"
          placeholder="Supervisor intervention notes…"
        />
      </div>
    </div>
  );
}
