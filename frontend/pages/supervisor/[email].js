import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

export default function SupervisorStudentDetails() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [documents, setDocuments] = useState({});
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
      if (!res.ok) throw new Error(json.error || "Failed");

      setStudent(json.row || null);
      setTimeline(Array.isArray(json.row?.timeline) ? json.row.timeline : []);
      setDocuments(json.row?.documents || {});
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

  if (loading)
    return <div className="p-6 text-center">Loading…</div>;

  if (err)
    return <div className="p-6 text-center text-red-600">{err}</div>;

  if (!student)
    return <div className="p-6">No student data</div>;

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <button
        className="text-purple-700 underline mb-6"
        onClick={() => router.push("/supervisor")}
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-6">
        {student.student_name || "-"}
      </h1>

      {/* PROFILE */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <p><b>Email:</b> {student.email || "-"}</p>
        <p><b>Programme:</b> {student.programme || "-"}</p>
        <p><b>Department:</b> {student.department || "-"}</p>
      </div>

      {/* DOCUMENTS */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-2">📄 Documents</h3>
        {Object.keys(documents).length === 0 && (
          <p className="text-sm text-gray-500">No documents</p>
        )}
        {Object.entries(documents).map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span>{k}</span>
            {v ? (
              <a href={v} target="_blank" rel="noreferrer" className="text-purple-600">
                View
              </a>
            ) : (
              <span className="text-gray-400">–</span>
            )}
          </div>
        ))}
      </div>

      {/* TIMELINE */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-2">📅 Timeline</h3>
        <ul className="list-disc ml-5 text-sm">
          {timeline.length === 0 && <li>No timeline data</li>}
          {timeline.map((t, i) => (
            <li key={i}>{t.activity}</li>
          ))}
        </ul>
      </div>

      {/* CQI – SAFE */}
      <div className="bg-white rounded-xl p-4">
        <h3 className="font-semibold mb-2">
          🎯 CQI by Assessment (TRX500)
        </h3>

        {Object.keys(cqiByAssessment).length === 0 ? (
          <p className="text-sm text-gray-500">CQI not available</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(cqiByAssessment).map(([plo, status]) => (
              <span
                key={plo}
                className={`px-2 py-1 text-xs rounded-full font-semibold
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
