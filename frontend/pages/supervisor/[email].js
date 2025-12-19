import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

export default function SupervisorStudentDetails() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [cqiByAssessment, setCqiByAssessment] = useState({});
  const [cqiNarrative, setCqiNarrative] = useState([]);

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

      setStudent(json.row);
      setTimeline(json.row.timeline || []);
      setCqiByAssessment(json.row.cqiByAssessment || {});
      setCqiNarrative(json.row.cqiNarrative || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return <div className="p-6 text-center text-gray-600">Loading…</div>;

  if (err)
    return <div className="p-6 text-center text-red-600">{err}</div>;

  if (!student)
    return <div className="p-6">No student data found.</div>;

  const documents = student.documents || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <button
        className="text-purple-700 hover:underline mb-6"
        onClick={() => router.push("/supervisor")}
      >
        ← Back to Supervisor Dashboard
      </button>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
        Student Progress Overview
      </h1>

      {/* PROFILE */}
      <div className="bg-white shadow rounded-2xl p-6 mb-10">
        <h2 className="text-2xl font-bold mb-4">{student.student_name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-gray-700">
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Matric:</strong> {student.student_id}</p>
          <p><strong>Programme:</strong> {student.programme}</p>
          <p><strong>Field:</strong> {student.field}</p>
          <p><strong>Department:</strong> {student.department}</p>
        </div>
      </div>

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
      <div className="bg-white border shadow rounded-2xl p-6 mt-10">
        <h3 className="text-lg font-bold mb-4">📅 Timeline</h3>
        <ul className="list-disc ml-6 text-sm">
          {timeline.map((t, i) => (
            <li key={i}>{t.activity}</li>
          ))}
        </ul>
      </div>

      {/* ================= CQI (SAFE) ================= */}
      <div className="bg-white shadow rounded-2xl p-6 mt-10">
        <h3 className="text-xl font-bold mb-2 text-purple-700">
          🎯 CQI by Assessment Component (TRX500)
        </h3>

        {Object.keys(cqiByAssessment).length === 0 ? (
          <p className="text-sm text-gray-500">CQI data not available.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 mb-4">
              {Object.entries(cqiByAssessment).map(([plo, status]) => (
                <span
                  key={plo}
                  className={`px-3 py-1 rounded-full text-sm font-semibold
                    ${status === "GREEN" ? "bg-green-100 text-green-700" : ""}
                    ${status === "AMBER" ? "bg-yellow-100 text-yellow-700" : ""}
                    ${status === "RED" ? "bg-red-100 text-red-700" : ""}
                  `}
                >
                  {plo}: {status}
                </span>
              ))}
            </div>

            {cqiNarrative.length > 0 && (
              <ul className="list-disc list-inside text-sm text-gray-700">
                {cqiNarrative.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* DOCUMENT SECTION */
function DocumentSection({ title, items, documents }) {
  return (
    <div className="bg-white border rounded-2xl p-4 mb-6">
      <h4 className="font-semibold mb-3">{title}</h4>
      <ul className="space-y-2">
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
