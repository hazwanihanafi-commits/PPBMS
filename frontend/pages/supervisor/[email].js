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

      setStudent(json.row);
      setTimeline(json.row.timeline || []);
      setCqiByAssessment(json.row.cqiByAssessment || {});
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!student) return <div className="p-6">No student data</div>;

  const documents = student.documents || {};

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <button
        className="text-purple-700 underline mb-4"
        onClick={() => router.push("/supervisor")}
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">
        {student.student_name}
      </h1>

      <p><strong>Email:</strong> {student.email}</p>
      <p><strong>Programme:</strong> {student.programme}</p>

      {/* DOCUMENTS */}
      <DocumentSection
        title="Monitoring & Supervision"
        items={[
          "Development Plan & Learning Contract (DPLC)",
          "Student Supervision Logbook",
          "Annual Progress Review – Year 1",
          "Annual Progress Review – Year 2",
          "Annual Progress Review – Year 3 (Final Year)",
        ]}
        documents={documents}
      />

      {/* TIMELINE */}
      <div className="bg-white rounded-xl p-4 mt-6">
        <h3 className="font-semibold mb-2">Timeline</h3>
        <ul className="list-disc ml-5 text-sm">
          {timeline.map((t, i) => (
            <li key={i}>{t.activity}</li>
          ))}
        </ul>
      </div>

      {/* CQI (SAFE) */}
      <div className="bg-white rounded-xl p-4 mt-6">
        <h3 className="font-semibold mb-2">
          🎯 CQI by Assessment (TRX500)
        </h3>

        {Object.keys(cqiByAssessment).length === 0 ? (
          <p className="text-sm text-gray-500">No CQI data</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {Object.entries(cqiByAssessment).map(([plo, status]) => (
              <span
                key={plo}
                className={`px-3 py-1 rounded-full text-xs font-semibold
                  ${status === "GREEN" && "bg-green-100 text-green-700"}
                  ${status === "AMBER" && "bg-yellow-100 text-yellow-700"}
                  ${status === "RED" && "bg-red-100 text-red-700"}
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

/* ✅ DOCUMENT SECTION MUST BE OUTSIDE */
function DocumentSection({ title, items, documents }) {
  return (
    <div className="bg-white border rounded-xl p-4 mb-6">
      <h4 className="font-semibold mb-3">{title}</h4>
      <ul className="space-y-2 text-sm">
        {items.map(label => (
          <li key={label} className="flex justify-between">
            <span>{label}</span>
            {documents[label] ? (
              <a href={documents[label]} target="_blank" rel="noreferrer">
                View
              </a>
            ) : (
              <span className="text-gray-400">Not submitted</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
