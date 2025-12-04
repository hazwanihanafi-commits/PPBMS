// frontend/pages/supervisor/student/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

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
      if (!res.ok) return setErr(json.error || "Failed to load");

      setData(json.row);
      setTimeline(json.row.timeline || []);

    } catch (e) {
      setErr("Unable to load student data.");
      console.error(e);
    }

    setLoading(false);
  }

  if (loading) return <div className="p-4">Loading…</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;
  if (!data) return <div className="p-4">No student data.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      
      <button
        className="text-purple-700 mb-4 hover:underline"
        onClick={() => router.push("/supervisor")}
      >
        ← Back to Supervisor Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-6">Student Progress</h1>

      {/* =========================
          STUDENT INFO CARD
      ========================== */}
      <div className="bg-white shadow rounded-2xl p-6 mb-8 border border-gray-100">
        <h2 className="text-xl font-bold mb-3">{data.student_name}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
          <p><strong>Matric:</strong> {data.student_id}</p>
          <p><strong>Email:</strong> {data.email}</p>
          <p><strong>Programme:</strong> {data.programme}</p>
          <p><strong>Start Date:</strong> {data.start_date}</p>
          <p><strong>Field:</strong> {data.field}</p>
          <p><strong>Department:</strong> {data.department}</p>
          <p><strong>Main Supervisor:</strong> {data.supervisor}</p>
          <p><strong>Co-Supervisor(s):</strong> {data.cosupervisor || "-"}</p>
        </div>
      </div>

      {/* =========================
          DOCUMENTS SECTION
      ========================== */}
      <div className="mb-10">
        <h3 className="text-xl font-bold mb-3 text-purple-700">📄 Submitted Documents</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* DPLC */}
          <DocumentCard
            title="Development Plan & Learning Contract (DPLC)"
            url={data.documents?.dplc}
          />

          {/* APR 1 */}
          <DocumentCard
            title="Annual Progress Review (Year 1)"
            url={data.documents?.apr1}
          />

          {/* APR 2 */}
          <DocumentCard
            title="Annual Progress Review (Year 2)"
            url={data.documents?.apr2}
          />

          {/* FPR 3 */}
          <DocumentCard
            title="Final Progress Review (Year 3)"
            url={data.documents?.fpr3}
          />
        </div>
      </div>

      {/* =========================
          TIMELINE TABLE
      ========================== */}
      <div className="bg-white p-6 shadow rounded-2xl border border-gray-100">
        <h3 className="text-lg font-bold mb-4">📅 Expected vs Actual</h3>

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
              {timeline.map((t, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-3">{t.activity}</td>
                  <td className="p-3">{t.expected || "-"}</td>
                  <td className="p-3">{t.actual || "-"}</td>
                  <td className="p-3">{t.status}</td>
                  <td className="p-3">{t.remaining_days}</td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}

/* =============================
    DOCUMENT CARD COMPONENT
============================= */
function DocumentCard({ title, url }) {
  return (
    <div className="p-4 bg-white rounded-2xl shadow border border-gray-100">
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>

      {url ? (
        <a
          href={url}
          target="_blank"
          className="text-purple-600 font-semibold hover:underline"
        >
          View Document →
        </a>
      ) : (
        <p className="text-gray-400 text-sm">No document submitted yet.</p>
      )}
    </div>
  );
}
