import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

export default function SupervisorStudentDetails() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cqiByAssessment, setCqiByAssessment] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  async function loadStudent() {
    setLoading(true);
    setErr("");

    try {
      const token = localStorage.getItem("ppbms_token");

      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${email}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load");
      }

      setStudent(json.row);
      setTimeline(Array.isArray(json.row.timeline) ? json.row.timeline : {});
      setCqiByAssessment(
        typeof json.row.cqiByAssessment === "object"
          ? json.row.cqiByAssessment
          : {}
      );

    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!student) return <div className="p-6">No student data</div>;

  return (
    <div className="min-h-screen bg-purple-50 p-6">

      <button
        className="text-purple-700 underline mb-4"
        onClick={() => router.push("/supervisor")}
      >
        ← Back to Supervisor
      </button>

      <h1 className="text-2xl font-bold mb-2">
        {student.student_name}
      </h1>

      <p className="text-sm mb-4">{student.email}</p>

      {/* ================= TIMELINE ================= */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-2">📅 Timeline</h3>

        {timeline.length === 0 ? (
          <p className="text-sm text-gray-500">No timeline data</p>
        ) : (
          <ul className="list-disc ml-5 text-sm">
            {timeline.map((t, i) => (
              <li key={i}>
                {t.activity} — {t.status}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ================= CQI ================= */}
      <div className="bg-white rounded-xl p-4">
        <h3 className="font-semibold mb-2">
          🎯 CQI by Assessment (TRX500)
        </h3>

        {Object.keys(cqiByAssessment).length === 0 ? (
          <p className="text-sm text-gray-500">CQI data not available</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(cqiByAssessment).map(([plo, status]) => (
              <span
                key={plo}
                className={`px-3 py-1 rounded-full text-xs font-semibold
                  ${status === "GREEN" ? "bg-green-100 text-green-700" : ""}
                  ${status === "AMBER" ? "bg-yellow-100 text-yellow-700" : ""}
                  ${status === "RED" ? "bg-red-100 text-red-700" : ""}
                `}
              >
                {plo}: {status}
              </span>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
