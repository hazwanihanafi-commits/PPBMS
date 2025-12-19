import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

/* ===== SAFE STRING ONLY RENDER ===== */
function safeText(v) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string" || typeof v === "number") return String(v);
  return "-";
}

export default function SupervisorStudentDetails() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [cqiByAssessment, setCqiByAssessment] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (email) fetchStudent();
  }, [email]);

  async function fetchStudent() {
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
      if (!res.ok) throw new Error(json.error || "Failed");

      setStudent(json.row || {});
      setTimeline(Array.isArray(json.row?.timeline) ? json.row.timeline : []);
      setCqiByAssessment(
        json.row?.cqiByAssessment &&
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

  /* ===== STATES ===== */
  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      {/* BACK */}
      <button
        className="text-purple-700 underline mb-4"
        onClick={() => router.push("/supervisor")}
      >
        ← Back
      </button>

      {/* TITLE */}
      <h1 className="text-2xl font-bold mb-4">
        {safeText(student.student_name)}
      </h1>

      {/* ===== PROFILE ===== */}
      <div className="bg-white rounded-xl p-4 mb-6 text-sm">
        <p><strong>Email:</strong> {safeText(student.email)}</p>
        <p><strong>Matric:</strong> {safeText(student.student_id)}</p>
        <p><strong>Programme:</strong> {safeText(student.programme)}</p>
        <p><strong>Field:</strong> {safeText(student.field)}</p>
        <p><strong>Department:</strong> {safeText(student.department)}</p>
      </div>

      {/* ===== TIMELINE ===== */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-2">Timeline</h3>

        {timeline.length === 0 ? (
          <p className="text-sm text-gray-500">No timeline data</p>
        ) : (
          <ul className="list-disc ml-5 text-sm">
            {timeline.map((t, i) => (
              <li key={i}>{safeText(t.activity)}</li>
            ))}
          </ul>
        )}
      </div>

      {/* ===== CQI BOX (NO OBJECT RENDERING) ===== */}
      <div className="bg-white rounded-xl p-4">
        <h3 className="font-semibold mb-3">
          🎯 CQI by Assessment (TRX500)
        </h3>

        {Object.keys(cqiByAssessment).length === 0 ? (
          <p className="text-sm text-gray-500">No CQI data</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(cqiByAssessment).map(([plo, status]) => {
              let cls = "bg-gray-200 text-gray-700";

              if (status === "GREEN") cls = "bg-green-100 text-green-700";
              else if (status === "AMBER") cls = "bg-yellow-100 text-yellow-700";
              else if (status === "RED") cls = "bg-red-100 text-red-700";

              return (
                <span
                  key={plo}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}
                >
                  {plo}: {safeText(status)}
                </span>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">
          <strong>Legend:</strong> GREEN ≥ 70% | AMBER 46–69% | RED &lt; 46%
        </p>
      </div>
    </div>
  );
}
