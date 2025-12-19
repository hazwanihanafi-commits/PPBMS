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
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) return;
    loadStudent();
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

      setStudent(json.row);
      setTimeline(json.row.timeline || []);
      setCqiByAssessment(json.row.cqiByAssessment || {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!student) return <div className="p-6">No data</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button
        onClick={() => router.push("/supervisor")}
        className="text-purple-700 underline mb-4"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-2">
        {student.student_name}
      </h1>

      <p className="mb-6 text-sm text-gray-600">
        {student.programme}
      </p>

  {/* ================= DOCUMENTS ================= */}
<div className="bg-white rounded-xl p-4 mb-6">
  <h3 className="font-semibold mb-3 text-purple-700">
    📄 Submitted Documents
  </h3>

  <DocumentSection
    title="Monitoring & Supervision"
    items={[
      "Development Plan & Learning Contract (DPLC)",
      "Student Supervision Logbook",
      "Annual Progress Review – Year 1",
      "Annual Progress Review – Year 2",
      "Annual Progress Review – Year 3 (Final Year)",
    ]}
    documents={student.documents || {}}
  />

  <DocumentSection
    title="Ethics & Research Outputs"
    items={[
      "ETHICS_APPROVAL",
      "PUBLICATION_ACCEPTANCE",
      "PROOF_OF_SUBMISSION",
      "CONFERENCE_PRESENTATION",
      "THESIS_NOTICE",
      "VIVA_REPORT",
      "CORRECTION_VERIFICATION",
      "FINAL_THESIS",
    ]}
    documents={student.documents || {}}
  />
</div>


      {/* TIMELINE */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-2">Timeline</h3>
        <ul className="list-disc ml-5 text-sm">
          {timeline.map((t, i) => (
            <li key={i}>{t.activity}</li>
          ))}
        </ul>
      </div>

      {/* CQI */}
      <div className="bg-white rounded-xl p-4">
        <h3 className="font-semibold mb-3">
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
