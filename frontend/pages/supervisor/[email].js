import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

/* ---------- SAFE TEXT RENDER ---------- */
function text(v) {
  if (typeof v === "string" || typeof v === "number") return v;
  if (v === null || v === undefined) return "-";
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
      if (!res.ok) throw new Error(json.error || "Failed to load");

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

      {/* ---------- PROFILE ---------- */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <p><strong>Email:</strong> {text(student.email)}</p>
        <p><strong>Matric:</strong> {text(student.student_id)}</p>
        <p><strong>Programme:</strong> {text(student.programme)}</p>
        <p><strong>Field:</strong> {text(student.field)}</p>
        <p><strong>Department:</strong> {text(student.department)}</p>
      </div>

      {/* ---------- TIMELINE ---------- */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-2">Timeline</h3>

        {!Array.isArray(timeline) || timeline.length === 0 ? (
          <p className="text-sm text-gray-500">No timeline data</p>
        ) : (
          <ul className="list-disc ml-5 text-sm">
            {timeline.map((t, i) => (
              <li key={i}>{text(t.activity)}</li>
            ))}
          </ul>
        )}
      </div>

      {/* ---------- CQI STATUS BARS (SAFE) ---------- */}
      <div className="bg-white rounded-xl p-4">
        <h3 className="font-semibold mb-3">
          🎯 CQI by Assessment (TRX500)
        </h3>

        {Object.keys(cqiByAssessment).length === 0 ? (
          <p className="text-sm text-gray-500">No CQI data</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(cqiByAssessment).map(([plo, status]) => {
              let width = "30%";
              let color = "bg-red-500";

              if (status === "GREEN") {
                width = "100%";
                color = "bg-green-500";
              } else if (status === "AMBER") {
                width = "60%";
                color = "bg-yellow-400";
              }

              return (
                <div key={plo}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{plo}</span>
                    <span>{status}</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded h-3">
                    <div
                      className={`${color} h-3 rounded`}
                      style={{ width }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">
          <strong>Legend:</strong> GREEN = Achieved | AMBER = Monitor | RED = Intervention
        </p>
      </div>
    </div>
  );
}
