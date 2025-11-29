// pages/supervisor/[email].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SubmissionFolder from "../../components/SubmissionFolder";
const API = process.env.NEXT_PUBLIC_API_BASE;

export default function SupervisorStudentDetail() {
  const router = useRouter();
  const { email } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!email) return;
    const token = localStorage.getItem("ppbms_token");
    if (!token) {
      setError("Not logged in");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API}/api/supervisor/student/${encodeURIComponent(email)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const txt = await res.text();
        if (!res.ok) throw new Error(txt);
        const data = JSON.parse(txt);
        setStudent(data.student || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [email]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!student) return <div className="p-6">Student not found.</div>;

  // Prepare milestones/activities display (use fields from student.raw)
  // Show supervisor name instead of email if available
  const supervisorName = student.raw?.["Main Supervisor"] || student.supervisor || student.raw?.["Main Supervisor's Email"];

  // Build list of extended activities (12 items) for display
  const activities = [
    { key: "P1 Submitted", label: "P1 - Development & Learning Contract" },
    { key: "P3 Submitted", label: "P3 - Research Logbook (Weekly)" },
    { key: "P4 Submitted", label: "P4 - Monthly Supervisor Meeting Report" },
    { key: "P5 Submitted", label: "P5 - Annual Progress Review" },
    { key: "Thesis Draft Completed", label: "Thesis Draft Completed" },
    { key: "Ethical clearance obtained", label: "Ethical clearance obtained" },
    { key: "Pilot or Phase 1 completed", label: "Pilot or Phase 1 completed" },
    { key: "Progress approved", label: "Progress approved" },
    { key: "Seminar & report submitted", label: "Seminar & report submitted" },
    { key: "Phase 2 completed", label: "Phase 2 completed" },
    { key: "1 indexed paper submitted", label: "1 indexed paper submitted" },
    { key: "Conference presentation", label: "Conference presentation" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">{student.name}</h1>
        <p className="text-sm text-gray-600">{student.programme}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div><strong>Email:</strong> {student.email}</div>
          <div><strong>Supervisor:</strong> {supervisorName}</div>
          <div><strong>Field:</strong> {student.raw?.Field || "—"}</div>
          <div><strong>Department:</strong> {student.raw?.Department || "—"}</div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-lg font-semibold">Progress</h3>
        <div className="mt-2">
          <div className="text-3xl font-bold">{student.progress}%</div>
          <div className="text-sm text-gray-600">Status: <strong>{student.status}</strong></div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-lg font-semibold">Extended Activities / Submissions</h3>
        <div className="mt-4 grid grid-cols-1 gap-3">
          {activities.map((a) => {
            const val = student.raw?.[a.key] || "";
            const docLink = student.raw?.[`Submission Document ${a.key.replace(/\s+/g, " ")}`] || student.raw?.[`Submission Document ${a.key}`] || "";
            return (
              <div key={a.key} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{a.label}</div>
                  <div className="text-xs text-gray-500">{val || "Not submitted"}</div>
                </div>
                <div className="flex items-center gap-3">
                  {docLink ? (
                    <a href={docLink} target="_blank" rel="noreferrer" className="text-sm text-purple-600 hover:underline">
                      View document
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">No file</span>
                  )}
                  <a href={`/student/me?uploadFor=${encodeURIComponent(a.key)}`} className="px-3 py-1 bg-purple-600 text-white rounded text-sm">
                    Upload
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-lg font-semibold">Submission Folder</h3>
        <SubmissionFolder raw={student.raw} />
      </div>
    </div>
  );
}
