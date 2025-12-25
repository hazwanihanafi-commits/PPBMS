import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { API_BASE } from "../../../utils/api";
import AdminStudentChecklist from "../../../components/AdminStudentChecklist";
import TopBar from "../../../components/TopBar";

export default function AdminStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  async function loadStudent() {
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/student/${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
          },
        }
      );

      const data = await res.json();
      setStudent(data.row || null);
    } catch (e) {
      console.error("Admin load student error:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  if (!student) {
    return <div className="p-6">Student not found</div>;
  }

  /* =========================
     PROGRESS (READ-ONLY)
  ========================= */
  const timeline = student.timeline || [];
  const progress = timeline.length
    ? Math.round(
        (timeline.filter((t) => t.status === "Completed").length /
          timeline.length) *
          100
      )
    : 0;

  const isGraduated = student.status === "Graduated";

  return (
  <>
    <TopBar />
    
    <div className="p-10 max-w-5xl mx-auto space-y-8">

      {/* BACK */}
      <button
        onClick={() => router.push("/admin")}
        className="text-purple-700 underline"
      >
        ← Back to Admin Dashboard
      </button>

      {/* ================= STUDENT PROFILE ================= */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            {student.student_name}
          </h1>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isGraduated
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {student.status || "Active"}
          </span>
        </div>

        <p><strong>Matric:</strong> {student.student_id}</p>
        <p><strong>Email:</strong> {student.email}</p>
        <p><strong>Programme:</strong> {student.programme}</p>
        <p><strong>Field:</strong> {student.field}</p>
        <p><strong>Department:</strong> {student.department}</p>
        <p><strong>Main Supervisor:</strong> {student.supervisor}</p>

        {student.cosupervisors && (
          <p>
            <strong>Co-Supervisor(s):</strong> {student.cosupervisors}
          </p>
        )}

        {/* ================= PROGRESS ================= */}
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-sm font-semibold text-purple-700">
              {progress}%
            </span>
          </div>

          <div className="w-full bg-gray-200 h-3 rounded-full">
            <div
              className="bg-purple-600 h-3 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ================= OFFICIAL USM CV ================= */}
      <div className="flex items-center gap-3">
        <a
          href="https://webcentral2.usm.my/sccentral/smup/ptj_profilpelajar.asp?tag=search"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
        >
          📄 Open Official USM Student CV
        </a>

        <span className="text-xs text-gray-500">
          (Requires USM login)
        </span>
      </div>

      {/* ================= DOCUMENT CHECKLIST ================= */}
      <AdminStudentChecklist
        studentEmail={student.email}
        documents={student.documents || {}}
      />

      {/* ================= ADMIN NOTE ================= */}
      <div className="text-sm text-gray-500 italic">
        This is an administrative, read-only view.  
        CQI evaluation and academic remarks are managed by supervisors.
      </div>

    </div>
  );
}
