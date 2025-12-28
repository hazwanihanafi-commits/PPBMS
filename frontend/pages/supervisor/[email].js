import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

import SupervisorChecklist from "../../components/SupervisorChecklist";
import SupervisorRemark from "../../components/SupervisorRemark";
import FinalPLOTable from "../../components/FinalPLOTable";
import TopBar from "../../components/TopBar";
import StudentProfilePage from "../../components/StudentProfilePage";

/* ======================
   TABS
====================== */
function Tabs({ active, setActive }) {
  const Tab = ({ id, label }) => (
    <button
      onClick={() => setActive(id)}
      className={`px-4 py-2 rounded-xl font-semibold ${
        active === id
          ? "bg-purple-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex gap-3 mb-6">
      <Tab id="overview" label="Overview" />
      <Tab id="timeline" label="Timeline" />
      <Tab id="documents" label="Documents" />
      <Tab id="cqi" label="CQI / PLO" />
    </div>
  );
}

/* ======================
   PAGE
====================== */
export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  /* ======================
     AUTH
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
     LOAD STUDENT
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setStudent(data.row || null);
      setTimeline(data.row?.timeline || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  /* ======================
     RENDER
  ====================== */
  if (loading) return <div className="p-6">Loading…</div>;
  if (!student) return <div className="p-6">Student not found</div>;

  const cqiByAssessment = student.cqiByAssessment || {};
  const remarksByAssessment = student.remarksByAssessment || {};

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

  </>
);

  
