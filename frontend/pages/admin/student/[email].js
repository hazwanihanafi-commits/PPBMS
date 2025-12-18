import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { API_BASE } from "../../../utils/api";
import AdminStudentChecklist from "../../../components/AdminStudentChecklist";

export default function AdminStudentPage() {
  const router = useRouter();
  const { email } = router.query;
  const [student, setStudent] = useState(null);

  useEffect(() => {
    if (email) load();
  }, [email]);

  async function load() {
    const res = await fetch(
      `${API_BASE}/api/admin/student/${email}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`
        }
      }
    );
    const data = await res.json();
    setStudent(data.row);
  }

  if (!student) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <button
        onClick={() => router.push("/admin")}
        className="text-purple-700 underline mb-6"
      >
        ← Back to Admin Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-6">
        {student.student_name}
      </h1>

          <div className="mb-6 flex items-center gap-3">
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


      <AdminStudentChecklist
        studentEmail={student.email}
        documents={student.documents}
      />
    </div>
  );
}
