import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

/* ======================================================
   SUPERVISOR – STUDENT DETAILS PAGE
====================================================== */
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
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");

      setStudent(json.row);
      setTimeline(json.row.timeline || []);
      setDocuments(json.row.documents || {});
      setCqiByAssessment(json.row.cqiByAssessment || {});
    } catch (e) {
      console.error(e);
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ================= STATES ================= */
  if (loading) return <div className="p-6 text-gray-600">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!student) return <div className="p-6">No student data found.</div>;

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <button
        className="text-purple-700 underline mb-4"
        onClick={() => router.push("/supervisor")}
      >
        ← Back to Supervisor Dashboard
      </button>

      <h1 className="text-3xl font-extrabold mb-6">
        Student Progress Overview
      </h1>

      {/* ================= PROFILE ================= */}
      <div className="bg-white shadow rounded-2xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-3">{student.student_name}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-sm">
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Matric:</strong> {student.student_id}</p>
          <p><strong>Programme:</strong> {student.programme}</p>
          <p><strong>Field:</strong> {student.field}</p>
          <p><strong>Department:</strong> {student.department}</p>
          <p><strong>Start Date:</strong> {student.start_date}</p>
          <p><strong>Main Supervisor:</strong> {student.supervisor}</p>
          <p><strong>Co-Supervisor:</strong> {student.cosupervisor || "-"}</p>
        </div>
      </div>

      {/* ================= DOCUMENTS ================= */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-3 text-purple-700">
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
          documents={documents}
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
          documents={documents}
        />
      </div>

      {/* ================= TIMELINE ================= */}
      <div className="bg-white shadow rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bold mb-3">
          📅 Expected vs Actual Timeline
        </h3>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-50">
              <th className="p-2 text-left">Activity</th>
              <th className="p-2">Expected</th>
              <th className="p-2">Actual</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((t, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{t.activity}</td>
                <td className="p-2">{t.expected || "-"}</td>
                <td className="p-2">{t.actual || "-"}</td>
                <td className="p-2">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= CQI (SAFE) ================= */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h3 className="text-xl font-bold text-purple-700 mb-2">
          🎯 CQI by Assessment (TRX500)
        </h3>

        {Object.keys(cqiByAssessment).length === 0 ? (
          <p className="text-sm text-gray-500">
            CQI data not available yet.
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

        <p className="text-xs text-gray-500 mt-4">
          <strong>Indicator:</strong> GREEN ≥ 46% | AMBER = marginal | RED &lt; 46%
        </p>
      </div>
    </div>
  );
}

/* ======================================================
   DOCUMENT SECTION COMPONENT (SAFE)
====================================================== */
function DocumentSection({ title, items, documents }) {
  return (
    <div className="bg-white border rounded-2xl p-4 mb-4">
      <h4 className="font-semibold mb-2">{title}</h4>

      <ul className="space-y-1 text-sm">
        {items.map((label) => {
          const url = documents[label];
          return (
            <li key={label} className="flex justify-between border-b pb-1">
              <span>{url ? "✅" : "⬜"} {label}</span>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-600 underline"
                >
                  View
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
