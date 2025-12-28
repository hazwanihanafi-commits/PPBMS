import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

import TopBar from "../../components/TopBar";
import StudentProfilePage from "../../components/StudentProfilePage";

export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  /* ======================
     AUTH GUARD
  ====================== */
  useEffect(() => {
    const role = localStorage.getItem("ppbms_role");
    if (role !== "supervisor") {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    const email = localStorage.getItem("ppbms_email");
    const role = localStorage.getItem("ppbms_role");
    if (email && role) setUser({ email, role });
  }, []);

  /* ======================
     LOAD STUDENT (SAFE)
  ====================== */
  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  async function loadStudent() {
    try {
      const token = localStorage.getItem("ppbms_token");

      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-store",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // ✅ SAFE PARSE (NO CRASH ON 304)
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      setStudent(data.row || null);
      setTimeline(data.row?.timeline || []);
    } catch (e) {
      console.error("Load supervisor student failed:", e);
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }

  /* ======================
     RENDER GUARDS
  ====================== */
  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  return (
    <>
      <TopBar user={user} />

      {/* 🔙 Back button */}
      <div className="px-6 pt-4">
        <button
          onClick={() => router.push("/supervisor")}
          className="text-sm font-semibold text-purple-600 hover:underline"
        >
          ← Back to Supervisor Dashboard
        </button>
      </div>

      <StudentProfilePage
        student={student}
        timeline={timeline}
        role="supervisor"
      />
    </>
  );
}
