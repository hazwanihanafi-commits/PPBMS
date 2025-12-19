import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

/* 🔒 SAFE TEXT RENDER */
function text(v) {
  if (typeof v === "string" || typeof v === "number") return v;
  if (v === null || v === undefined) return "-";
  return JSON.stringify(v);
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
    setLoading(true);
    setErr("");

    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${email}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");

      setStudent(json.row || {});
      setTimeline(Array.isArray(json.row?.timeline) ? json.row.timeline : []);
      setCqiByAssessment(
        typeof json.row?.cqiByAssessment === "object"
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
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">
        {text(student.student_name)}
      </h1>

      {/* ===== PROFILE (SAFE) ===== */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <p><strong>Email:</strong> {text(student.email)}</p>
        <p><strong>Matric:</strong> {text(student.student_id)}</p>
        <p><strong>Programme:</strong> {text(student.programme)}</p>
        <p><strong>Field:</strong> {text(student.field)}</p>
        <p><strong>Department:</strong> {text(student.department)}</p>
      </div>

      {/* ===== TIMELINE (SAFE ARRAY) ===== */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-2">Timeline</h3>
        {timeline.length === 0 ? (
          <p className="text-sm text-gray-500">No timeline data</p>
        ) : (
          <ul className="list-disc ml-5 text-sm">
            {timeline.map((t, i) => (
              <li key={i}>{text(t.activity)}</li>
            ))}
          </ul>
        )}
      </div>

      {/* ===== CQI BOX (OBJECT SAFE) ===== */}
      <div className="bg-white rounded-xl p-4">
  <h3 className="font-semibold mb-2">
    🎯 CQI by Assessment (TRX500)
  </h3>

  {typeof cqiByAssessment !== "object" ||
  Object.keys(cqiByAssessment).length === 0 ? (
    <p className="text-sm text-gray-500">No CQI data</p>
  ) : (
    <div className="flex flex-wrap gap-2">
      {Object.entries(cqiByAssessment).map(([plo, status]) => {
        let colour = "bg-gray-200 text-gray-700";

        if (status === "GREEN") colour = "bg-green-100 text-green-700";
        if (status === "AMBER") colour = "bg-yellow-100 text-yellow-700";
        if (status === "RED") colour = "bg-red-100 text-red-700";

        return (
          <span
            key={plo}
            className={`px-3 py-1 rounded-full text-xs font-semibold ${colour}`}
          >
            {plo}: {status}
          </span>
        );
      })}
    </div>
  )}
</div>
}
