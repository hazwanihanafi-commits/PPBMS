// frontend/pages/supervisor/[email].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

export default function SupervisorStudentDetails() {
  const router = useRouter();
  const { email } = router.query;

  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (email) loadStudent();
  }, [email]);

  async function loadStudent() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/supervisor/student/${email}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const json = await res.json();
      if (!res.ok) return setErr(json.error || "Failed to load student data");

      // Backend must return { row: {...} }
      setData(json.row);
      setTimeline(json.row.timeline || []);

    } catch (e) {
      console.error(e);
      setErr("Unable to load student profile.");
    }
    setLoading(false);
  }

  if (loading) return <div className="p-6 text-center text-gray-600">Loading…</div>;
  if (err) return <div className="p-6 text-center text-red-600">{err}</div>;
  if (!data) return <div className="p-6">No student data found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">

      {/* Back Button */}
      <button
        className="text-purple-700 hover:underline mb-6"
        onClick={() => router.push("/supervisor")}
      >
        ← Back to Supervisor Dashboard
      </button>

      {/* Page Title */}
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
        Student Progress Overview
      </h1>

      {/* ============================
          PROFILE CARD
      ============================= */}
      <div className="bg-white shadow-card border border-gray-100 rounded-2xl p-6 mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {data.student_name}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-gray-700">
          <p><strong>Email:</strong> {data.email}</p>
          <p><strong>Matric:</strong> {data.student_id}</p>
          <p><strong>Programme:</strong> {data.programme}</p>
          <p><strong>Field:</strong> {data.field}</p>
          <p><strong>Department:</strong> {data.department}</p>
          <p><strong>Start Date:</strong> {data.start_date}</p>
          <p><strong>Main Supervisor:</strong> {data.supervisor}</p>
          <p><strong>Co-Supervisor(s):</strong> {data.cosupervisor || "-"}</p>
        </div>
      </div>

      {/* ============================
          DOCUMENT SECTION
      ============================= */}
      <div className="mb-10">
        <h3 className="text-xl font-bold mb-4 text-purple-700">
          📄 Submitted Documents
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <DocumentCard
            title="Development Plan & Learning Contract (DPLC)"
            url={data.documents?.dplc}
          />

          <DocumentCard
            title="Annual Progress Review (Year 1)"
            url={data.documents?.apr1}
          />

          <DocumentCard
            title="Annual Progress Review (Year 2)"
            url={data.documents?.apr2}
          />

          <DocumentCard
            title="Final Progress Review (Year 3)"
            url={data.documents?.fpr3}
          />
        </div>
      </div>

      {/* ============================
          TIMELINE TABLE
      ============================= */}
      <div className="bg-white border border-gray-100 shadow-card rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4">📅 Expected vs Actual Timeline</h3>

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
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-3">{t.activity}</td>
                    <td className="p-3">{t.expected || "-"}</td>
                    <td className="p-3">{t.actual || "-"}</td>

                    <td className="p-3">
                      <span
                        className={
                          "px-2 py-1 text-xs font-semibold rounded-full " +
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

/* =======================================
      Document Card Component
======================================= */
function DocumentCard({ title, url }) {
  return (
    <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow">
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>

      {url ? (
        <a
          href={url}
          target="_blank"
          className="text-purple-600 font-medium hover:underline"
        >
          View Document →
        </a>
      ) : (
        <p className="text-gray-400 text-sm">No document submitted yet.</p>
      )}
    </div>
  );
}
