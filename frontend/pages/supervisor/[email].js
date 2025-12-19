// frontend/pages/supervisor/[email].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

/* SAFE TEXT */
function text(v) {
  if (typeof v === "string" || typeof v === "number") return v;
  return "-";
}

export default function SupervisorStudentDetails() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cqiByAssessment, setCqiByAssessment] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (email) loadStudent();
  }, [email]);

  async function loadStudent() {
    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${email}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");

      setStudent(json.row || {});
      setTimeline(Array.isArray(json.row?.timeline) ? json.row.timeline : {});
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

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!student) return <div className="p-6">No student</div>;

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <button
        className="text-purple-700 underline mb-4"
        onClick={() => router.push("/supervisor")}
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">
        {text(student.student_name)}
      </h1>

      {/* PROFILE */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <p><strong>Email:</strong> {text(student.email)}</p>
        <p><strong>Matric:</strong> {text(student.student_id)}</p>
        <p><strong>Programme:</strong> {text(student.programme)}</p>
        <p><strong>Field:</strong> {text(student.field)}</p>
        <p><strong>Department:</strong> {text(student.department)}</p>
      </div>

      {/* TIMELINE */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-2">Timeline</h3>
        {Array.isArray(timeline) && timeline.length > 0 ? (
          <ul className="list-disc ml-5 text-sm">
            {timeline.map((t, i) => (
              <li key={i}>{text(t.activity)}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No timeline data</p>
        )}
      </div>

{/* ===== CQI PERCENT BAR CHART (GOOD = 70%) ===== */}
<div className="bg-white rounded-xl p-4 mt-6">
  <h3 className="font-semibold mb-4">
    📊 CQI by Assessment (TRX500) – Percent
  </h3>

  {typeof cqiByAssessment !== "object" ||
  Object.keys(cqiByAssessment).length === 0 ? (
    <p className="text-sm text-gray-500">No CQI data</p>
  ) : (
    <div className="space-y-3">
      {Object.entries(cqiByAssessment).map(([plo, value]) => {
        const score = Number(value);

        if (Number.isNaN(score)) return null;

        let color = "bg-red-500";
        let label = "Intervention";

        if (score >= 70) {
          color = "bg-green-500";
          label = "Good";
        } else if (score >= 46) {
          color = "bg-yellow-400";
          label = "Monitor";
        }

        return (
          <div key={plo}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold">{plo}</span>
              <span>{score}% · {label}</span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`${color} h-3 rounded-full`}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  )}

  <p className="text-xs text-gray-500 mt-4">
    <strong>Legend:</strong> Green ≥ 70% | Yellow 46–69% | Red &lt; 46%
  </p>
</div>
