// pages/supervisor/[email].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SupervisorStudentView() {
  const router = useRouter();
  const { email } = router.query;

  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!email) return;

    const token = localStorage.getItem("ppbms_token");
    if (!token) return;

    fetch(`${API}/api/supervisor/student/${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((d) => {
        setData(d.student);
        setTimeline(d.timeline || []);
      })
      .catch((err) => setError(err.message));
  }, [email]);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Student Details */}
      <div className="border p-4 rounded bg-white shadow-md">
        <h2 className="text-lg font-bold mb-2">{data.student_name}</h2>

        <p><b>Programme:</b> {data.programme}</p>
        <p><b>Field:</b> {data.field}</p>
        <p><b>Department:</b> {data.department}</p>
        <p><b>Start Date:</b> {data.start_date}</p>
        <p><b>Email:</b> {data.email}</p>

        <div className="mt-4">
          <b>Progress:</b> {data.progress}% ({data.completed} of {data.total} completed)
        </div>
      </div>

      {/* Timeline Table */}
      <div className="border rounded bg-white shadow-md">
        <h3 className="text-xl font-bold p-4 border-b">Activity Timeline</h3>

        <table className="w-full text-sm">
          <thead className="bg-purple-600 text-white">
            <tr>
              <th className="p-2">Activity</th>
              <th className="p-2">Expected</th>
              <th className="p-2">Actual</th>
              <th className="p-2">Status</th>
              <th className="p-2">Remaining</th>
            </tr>
          </thead>

          <tbody>
            {timeline.length > 0 ? (
              timeline.map((t) => (
                <tr key={t.activity} className="border-b">
                  <td className="p-2">{t.activity}</td>
                  <td className="p-2">{t.expected}</td>
                  <td className="p-2">{t.actual || "-"}</td>

                  <td className="p-2">
                    {t.status === "Late" && (
                      <span className="text-red-500 font-semibold">Late</span>
                    )}
                    {t.status === "On Track" && (
                      <span className="text-blue-600 font-semibold">On Track</span>
                    )}
                    {t.status === "Completed" && (
                      <span className="text-green-700 font-semibold">Completed</span>
                    )}
                  </td>

                  <td className="p-2">{t.remaining}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center p-4 text-gray-500">
                  No timeline data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
