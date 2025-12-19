import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

/* ================= ABSOLUTE SAFE RENDER ================= */
function renderText(v) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string") return v;
  if (typeof v === "number") return v.toString();
  try {
    return JSON.stringify(v);
  } catch {
    return "-";
  }
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
      if (!res.ok) throw new Error(json.error || "Load failed");

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

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <button
        className="text-purple-700 underline mb-4"
        onClick={() => router.push("/supervisor")}
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">
        {renderText(student.student_name)}
      </h1>

      {/* PROFILE */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <p><b>Email:</b> {renderText(student.email)}</p>
        <p><b>Matric:</b> {renderText(student.student_id)}</p>
        <p><b>Programme:</b> {renderText(student.programme)}</p>
        <p><b>Field:</b> {renderText(student.field)}</p>
        <p><b>Department:</b> {renderText(student.department)}</p>
      </div>

      {/* TIMELINE */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-2">Timeline</h3>
        <ul className="list-disc ml-6 text-sm">
          {timeline.map((t, i) => (
            <li key={i}>{renderText(t.activity)}</li>
          ))}
        </ul>
      </div>

      {/* CQI */}
      <div className="bg-white rounded-xl p-4">
        <h3 className="font-semibold mb-2">
          🎯 CQI by Assessment (TRX500)
        </h3>

        {Object.keys(cqiByAssessment).length === 0 ? (
          <p className="text-sm text-gray-500">No CQI data</p>
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
                {plo}: {renderText(status)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
