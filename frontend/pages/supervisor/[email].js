// frontend/pages/supervisor/student/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../../utils/api";   // FIXED PATH

export default function SupervisorViewStudent() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function load() {
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/supervisor/student/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const json = await res.json();
      if (!res.ok) return setErr(json.error || "Unable to load student data.");

      setData(json);
      setTimeline(json.timeline || []);
    } catch (e) {
      setErr("Unable to load student data.");
      console.error(e);
    }

    setLoading(false);
  }

  if (loading) return <div className="p-6 text-gray-600">Loading student profile…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data) return <div className="p-6">No student data.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-8">

      {/* BACK BUTTON */}
      <button
        className="text-purple-700 mb-6 font-medium hover:underline"
        onClick={() => router.push("/supervisor")}
      >
        ← Back to Supervisor Dashboard
      </button>

      {/* PAGE TITLE */}
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
        👤 Student Progress Overview
      </h1>

      {/* ======================================
          STUDENT PROFILE CARD
      ======================================= */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {data.name}
            </h2>
            <p className="text-gray-600">{data.email}</p>
          </div>

          <div className="text-right md:text-left">
            <p className="text-sm text-gray-500">Overall Progress</p>
            <p className="text-3xl font-extrabold text-purple-700">
              {data.progress}%
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <p><strong>Matric:</strong> {data.matric}</p>
          <p><strong>Programme:</strong> {data.programme}</p>
          <p><strong>Start Date:</strong> {data.start_date}</p>
          <p><strong>Field:</strong> {data.field}</p>
          <p><strong>Department:</strong> {data.department}</p>
          <p><strong>Supervisor:</strong> {data.supervisor}</p>
          <p><strong>Co-Supervisor(s):</strong> {data.cosupervisor}</p>
          <p><strong>Supervisor Email:</strong> {data.supervisorEmail}</p>
        </div>
      </div>

      {/* ======================================
          DOCUMENTS SECTION
      ======================================= */}
      <div className="mb-10">
        <h3 className="text-2xl font-bold text-purple-700 mb-6">
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

      {/* ======================================
          TIMELINE TABLE
      ======================================= */}
      <div className="bg-white rounded-2xl p-8 shadow-card border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
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

                const isLate =
                  !t.actual && t.remaining_days < 0 && t.status !== "Completed";

                return (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-3">{t.activity}</td>
                    <td className="p-3">{t.expected || "-"}</td>
                    <td className="p-3">{t.actual || "-"}</td>

                    <td
                      className={`p-3 font-semibold ${
                        t.status === "Completed"
                          ? "text-green-600"
                          : isLate
                          ? "text-red-600"
                          : "text-gray-700"
                      }`}
                    >
                      {isLate ? "Delayed" : t.status}
                    </td>

                    <td
                      className={`p-3 ${
                        isLate ? "text-red-600 font-semibold" : ""
                      }`}
                    >
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

/* ==========================================================
   REUSABLE DOCUMENT CARD COMPONENT
========================================================== */
function DocumentCard({ title, url }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
      <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>

      {url ? (
        <a
          href={url}
          target="_blank"
          className="text-purple-600 font-semibold hover:underline"
        >
          View Document →
        </a>
      ) : (
        <p className="text-gray-400 text-sm">No document submitted.</p>
      )}
    </div>
  );
}
