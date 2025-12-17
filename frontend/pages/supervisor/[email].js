// frontend/pages/supervisor/[email].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

export default function SupervisorStudentDetails() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (email) loadAll();
  }, [email]);

  async function loadAll() {
    setLoading(true);
    try {
      const token = localStorage.getItem("ppbms_token");

      /* =====================
         STUDENT PROFILE
      ===================== */
      const resStudent = await fetch(
        `${API_BASE}/api/supervisor/student/${email}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const studentJson = await resStudent.json();
      if (!resStudent.ok) {
        setErr(studentJson.error || "Failed to load student");
        return;
      }

      setStudent(studentJson.row);
      setTimeline(studentJson.row.timeline || []);

      /* =====================
         DOCUMENTS
      ===================== */
      const resDocs = await fetch(
        `${API_BASE}/api/supervisor/documents/${email}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const docsJson = await resDocs.json();
      setDocuments(Array.isArray(docsJson) ? docsJson : []);

    } catch (e) {
      console.error(e);
      setErr("Unable to load student data.");
    }
    setLoading(false);
  }

  if (loading)
    return <div className="p-6 text-center text-gray-600">Loading…</div>;

  if (err)
    return <div className="p-6 text-center text-red-600">{err}</div>;

  if (!student)
    return <div className="p-6">No student data found.</div>;

  const groupedDocs = groupBySection(documents);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">

      {/* Back */}
      <button
        className="text-purple-700 hover:underline mb-6"
        onClick={() => router.push("/supervisor")}
      >
        ← Back to Supervisor Dashboard
      </button>

      {/* Title */}
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
        Student Progress Overview
      </h1>

      {/* ================= PROFILE ================= */}
      <div className="bg-white shadow border rounded-2xl p-6 mb-10">
        <h2 className="text-2xl font-bold mb-4">{student.student_name}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-gray-700">
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Matric:</strong> {student.student_id}</p>
          <p><strong>Programme:</strong> {student.programme}</p>
          <p><strong>Field:</strong> {student.field}</p>
          <p><strong>Department:</strong> {student.department}</p>
          <p><strong>Start Date:</strong> {student.start_date}</p>
          <p><strong>Main Supervisor:</strong> {student.supervisor}</p>
          <p><strong>Co-Supervisor(s):</strong> {student.cosupervisor || "-"}</p>
        </div>
      </div>

      {/* ================= DOCUMENTS ================= */}
      <div className="mb-10">
        <h3 className="text-xl font-bold mb-4 text-purple-700">
          📄 Submitted Documents
        </h3>

        {Object.keys(groupedDocs).length === 0 && (
          <p className="text-gray-500">No documents submitted yet.</p>
        )}

        {Object.entries(groupedDocs).map(([section, items]) => (
          <div
            key={section}
            className="bg-white border rounded-2xl p-4 mb-5"
          >
            <h4 className="font-semibold mb-3">{section}</h4>

            <ul className="space-y-2">
              {items.map(doc => (
                <li
                  key={doc.document_id}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <span className="text-sm">
                    {doc.file_url ? "✅" : "⬜"} {doc.document_type}
                  </span>

                  {doc.file_url ? (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 text-sm hover:underline"
                    >
                      View →
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Not submitted
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ================= TIMELINE ================= */}
      <div className="bg-white border shadow rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4">
          📅 Expected vs Actual Timeline
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-50 text-purple-700">
                <th className="p-3 text-left">Activity</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Actual</th>
                <th className="p-3">Status</th>
                <th className="p-3">Remaining</th>
              </tr>
            </thead>

            <tbody>
              {timeline.map((t, i) => {
                const late = !t.actual && t.remaining_days < 0;

                return (
                  <tr key={i} className="border-t">
                    <td className="p-3">{t.activity}</td>
                    <td className="p-3">{t.expected || "-"}</td>
                    <td className="p-3">{t.actual || "-"}</td>

                    <td className="p-3">
                      <span
                        className={
                          "px-2 py-1 text-xs rounded-full font-semibold " +
                          (t.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : late
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700")
                        }
                      >
                        {late ? "Delayed" : t.status}
                      </span>
                    </td>

                    <td className={`p-3 ${late ? "text-red-600 font-semibold" : ""}`}>
                      {t.remaining_days}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================= UTIL ================= */
function groupBySection(docs) {
  return docs.reduce((acc, d) => {
    acc[d.section] = acc[d.section] || [];
    acc[d.section].push(d);
    return acc;
  }, {});
}
