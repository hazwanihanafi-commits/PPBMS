// frontend/pages/supervisor/[email].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

/* Helper: extract all FileURL columns from raw row */
function extractSubmissionLinks(raw) {
  if (!raw) return [];
  const links = [];

  Object.keys(raw).forEach((key) => {
    if (key.includes("FileURL") && raw[key]) {
      links.push({
        label: key.replace(" - FileURL", ""),
        url: raw[key],
      });
    }
  });

  return links;
}

/* Status badge for timeline */
function StatusBadge({ status }) {
  let color = "bg-gray-200 text-gray-700";

  if (status === "Completed") color = "bg-green-100 text-green-700";
  if (status === "On Track") color = "bg-blue-100 text-blue-700";
  if (status === "Late") color = "bg-red-100 text-red-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {status}
    </span>
  );
}

export default function SupervisorStudentView() {
  const router = useRouter();
  const { email } = router.query;

  const [data, setData] = useState(null);      // student + raw
  const [timeline, setTimeline] = useState([]); 
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!email) return;

    const token = localStorage.getItem("ppbms_token");
    if (!token) {
      setError("Not authenticated");
      return;
    }

    fetch(`${API}/api/supervisor/student/${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load student data");
        return r.json();
      })
      .then((d) => {
        // d.student, d.timeline, d.raw from backend
        setData({ ...d.student, raw: d.raw });
        setTimeline(d.timeline || []);
      })
      .catch((err) => setError(err.message));
  }, [email]);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6">Loading…</div>;

  const initials = (data.student_name || "NA")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const submissionLinks = extractSubmissionLinks(data.raw);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* HEADER CARD */}
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <button
          onClick={() => router.back()}
          className="text-sm underline text-white mb-3"
        >
          ← Back to Supervisor Dashboard
        </button>

        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white text-3xl font-bold">
            {initials}
          </div>

          <div>
            <h1 className="text-3xl font-bold">{data.student_name}</h1>
            <p className="text-white/90 text-lg">{data.programme}</p>
          </div>
        </div>
      </div>

      {/* PROFILE CARD */}
      <div className="rounded-xl bg-white shadow p-6 space-y-4">
        <h2 className="text-xl font-bold text-purple-700">Student Profile</h2>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-semibold text-gray-700">Email</p>
            <p>{data.email}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-700">Start Date</p>
            <p>{data.start_date || "-"}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-700">Field</p>
            <p>{data.field || "-"}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-700">Department</p>
            <p>{data.department || "-"}</p>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-6">
          <h3 className="font-semibold text-gray-700 mb-1">
            Overall Progress
          </h3>

          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all"
              style={{ width: `${data.progress}%` }}
            />
          </div>

          <p className="mt-1 text-sm text-gray-700 font-medium">
            {data.progress}% — {data.completed} of {data.total} milestones
            completed
          </p>
        </div>
      </div>

      {/* SUBMISSION FOLDER LINKS */}
      <div className="rounded-xl bg-white shadow p-6">
        <h2 className="text-xl font-bold text-purple-700 mb-4">
          Submission Folder Uploads
        </h2>

        {submissionLinks.length === 0 && (
          <p className="text-gray-500 text-sm">No files submitted yet.</p>
        )}

        <div className="space-y-3">
          {submissionLinks.map((f, i) => (
            <a
              key={i}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="block p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 text-purple-700 font-medium"
            >
              📎 {f.label}
            </a>
          ))}
        </div>
      </div>

      {/* TIMELINE TABLE */}
      <div className="rounded-xl bg-white shadow overflow-hidden">
        <h3 className="text-xl font-bold p-4 border-b text-purple-700">
          Activity Timeline
        </h3>

        <table className="w-full text-sm">
          <thead className="bg-purple-600 text-white">
            <tr>
              <th className="p-2 text-left">Activity</th>
              <th className="p-2 text-left">Expected</th>
              <th className="p-2 text-left">Actual</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Remaining</th>
            </tr>
          </thead>

          <tbody>
            {timeline.length > 0 ? (
              timeline.map((t) => (
                <tr key={t.activity} className="border-b">
                  <td className="p-3">{t.activity}</td>
                  <td className="p-3">{t.expected}</td>
                  <td className="p-3">{t.actual || "-"}</td>
                  <td className="p-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="p-3">{t.remaining || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center p-4 text-gray-500">
                  No timeline data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
