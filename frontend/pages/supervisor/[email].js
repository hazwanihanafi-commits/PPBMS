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
  const [error, setError] = useState("");

  useEffect(() => {
    if (email) fetchStudent();
  }, [email]);

  async function fetchStudent() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${email}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");

      setStudent(json.row);
      setTimeline(json.row.timeline || []);
      setDocuments(json.row.documents || {});
      setCqiByAssessment(json.row.cqiByAssessment || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!student) return <div className="p-6">No student data</div>;

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <button
        onClick={() => router.push("/supervisor")}
        className="text-purple-700 underline mb-6"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">
        {student.student_name}
      </h1>

      {/* PROFILE */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <p><strong>Email:</strong> {student.email}</p>
        <p><strong>Matric:</strong> {student.student_id}</p>
        <p><strong>Programme:</strong> {student.programme}</p>
        <p><strong>Field:</strong> {student.field}</p>
        <p><strong>Department:</strong> {student.department}</p>
      </div>

      {/* DOCUMENTS */}
      <DocumentSection
        title="Submitted Documents"
        documents={documents}
      />

      {/* TIMELINE */}
      <div className="bg-white rounded-xl p-4 mt-6">
        <h3 className="font-semibold mb-2">📅 Timeline</h3>
        <ul className="list-disc ml-6 text-sm">
          {timeline.map((t, i) => (
            <li key={i}>{t.activity}</li>
          ))}
        </ul>
      </div>

      {/* ================= CQI (ABSOLUTELY SAFE) ================= */}
      <div className="bg-white rounded-xl p-4 mt-6">
        <h3 className="font-semibold mb-2">
          🎯 CQI by Assessment (TRX500)
        </h3>

        {Object.keys(cqiByAssessment).length === 0 ? (
          <p className="text-sm text-gray-500">
            CQI data not available
          </p>
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

/* ================= DOCUMENT SECTION ================= */
function DocumentSection({ title, documents }) {
  const labels = Object.keys(documents);

  return (
    <div className="bg-white rounded-xl p-4 mb-6">
      <h3 className="font-semibold mb-2">{title}</h3>

      {labels.length === 0 ? (
        <p className="text-sm text-gray-500">No documents</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {labels.map(label => (
            <li key={label} className="flex justify-between">
              <span>{label}</span>
              {documents[label] ? (
                <a
                  href={documents[label]}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-600 underline"
                >
                  View
                </a>
              ) : (
                <span className="text-gray-400">Not submitted</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
