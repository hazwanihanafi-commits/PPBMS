import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";

export default function SupervisorStudentView() {
  const router = useRouter();
  const { email } = router.query;

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (email) loadStudent();
  }, [email]);

  async function loadStudent() {
    try {
      const res = await fetch(`${API_BASE}/api/supervisor/student/${email}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const json = await res.json();
      if (json.error) setError(json.error);
      else setData(json);
    } catch (e) {
      console.error(e);
      setError("Failed to load data");
    }
  }

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        className="mb-4 text-purple-600 hover:underline"
        onClick={() => router.push("/supervisor")}
      >
        ← Back to Supervisor Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-4">Student Progress</h1>

      {/* ==============================
          STUDENT PROFILE
      =============================== */}
      <div className="bg-white shadow rounded p-6 mb-6">
  <h2 className="text-xl font-semibold mb-4">{data.name}</h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">

    <p><strong>Matric:</strong> {data.matric}</p>
    <p><strong>Email:</strong> {data.email}</p>

    <p><strong>Programme:</strong> {data.programme}</p>
    <p><strong>Start Date:</strong> {data.start_date}</p>

    <p><strong>Field:</strong> {data.field}</p>
    <p><strong>Department:</strong> {data.department}</p>

    <p><strong>Main Supervisor:</strong> {data.supervisor}</p>
    <p><strong>Co-Supervisor(s):</strong> {data.cosupervisor}</p>

    <p><strong>Supervisor Email:</strong> {data.supervisorEmail}</p>

    <p className="mt-2 col-span-2"><strong>Progress:</strong> {data.progress}%</p>
  </div>
</div>


      {/* ==============================
          TIMELINE TABLE
      =============================== */}
      <h2 className="text-lg font-bold mb-2">Expected vs Actual</h2>

      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-200 border-b">
            <th className="p-2">Activity</th>
            <th className="p-2">Expected</th>
            <th className="p-2">Actual</th>
            <th className="p-2">Status</th>
            <th className="p-2">Remaining</th>
          </tr>
        </thead>

        <tbody>
          {data.timeline.map((t, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{t.activity}</td>
              <td className="p-2">{t.expected || "-"}</td>
              <td className="p-2">{t.actual || "-"}</td>
              <td className="p-2">{t.status}</td>
              <td className="p-2">
                {t.remaining_days === "" ? "-" : t.remaining_days}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
