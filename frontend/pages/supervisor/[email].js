import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import SupervisorChecklist from "../../components/SupervisorChecklist";

export default function SupervisorStudentDetails() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (email) loadStudent();
  }, [email]);

  async function loadStudent() {
    setLoading(true);
    try {
      const token = localStorage.getItem("ppbms_token");

      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${email}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const json = await res.json();
      if (!res.ok) {
        setErr(json.error || "Failed to load student");
        return;
      }

      setStudent(json.row);
      setTimeline(json.row.timeline || []);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">

      {/* BACK */}
      <button
        className="text-purple-700 hover:underline mb-6"
        onClick={() => router.push("/supervisor")}
      >
        ← Back to Supervisor Dashboard
      </button>

      {/* TITLE */}
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
        Student Progress Overview
      </h1>

      {/* ================= PROFILE ================= */}
      <div className="bg-white shadow border rounded-2xl p-6 mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {student.student_name}
        </h2>

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

      {/* ================= CHECKLIST (SAME AS STUDENT) ================= */}
      <div className="mb-10">
        <SupervisorChecklist documents={student.documents} />
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
