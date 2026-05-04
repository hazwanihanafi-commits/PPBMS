// ==========================================
// FINAL PPBMS ADMIN DASHBOARD (FIXED)
// ==========================================

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Search,
  Bell,
  LogOut,
  FileBarChart2,
  ClipboardList,
  BookOpen,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { apiGet } from "@/utils/api";

/* ==========================================
   STATUS BADGE (SYNC WITH SUPERVISOR)
========================================== */
function StatusBadge({ status }) {
  const s = status?.toUpperCase();

  const map = {
    ON_TRACK: "bg-green-100 text-green-700",
    SLIGHTLY_DELAYED: "bg-orange-100 text-orange-700",
    AT_RISK: "bg-red-100 text-red-700",
    GRADUATED: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs ${map[s] || "bg-gray-100"}`}>
      {s?.replaceAll("_", " ")}
    </span>
  );
}

/* ==========================================
   PAGE
========================================== */
export default function AdminDashboard() {
  const router = useRouter();

  const [checked, setChecked] = useState(false);
  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");

  const [summary, setSummary] = useState({});
  const [graduates, setGraduates] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ==========================================
     AUTH
  ========================================== */
  useEffect(() => {
    if (!router.isReady) return;

    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");

    if (!token || role !== "admin") {
      localStorage.clear();
      router.replace("/login");
      return;
    }

    setChecked(true);
  }, [router.isReady]);

  /* ==========================================
     LOAD PROGRAMMES
  ========================================== */
  useEffect(() => {
    if (!checked) return;

    apiGet("/api/admin/programmes/students")
      .then((d) => setProgrammes(d.programmes || []))
      .catch(() => setProgrammes([]));
  }, [checked]);

  /* ==========================================
     LOAD DATA
  ========================================== */
  useEffect(() => {
    if (!programme) return;

    Promise.all([
      apiGet(`/api/admin/programme-active-students?programme=${programme}`),
      apiGet(`/api/admin/programme-graduates?programme=${programme}`),
      apiGet(`/api/admin/programme-summary?programme=${programme}`),
    ]).then(([active, grad, sum]) => {
      setActiveStudents(active.students || []);
      setGraduates(grad.students || []);
      setSummary(sum || {});
    });
  }, [programme]);

  /* ==========================================
     FILTER (FIXED)
  ========================================== */
  const students = useMemo(() => {
    const all = [...activeStudents, ...graduates];

    return all.filter((s) => {
      const q = search.toLowerCase();

      const matchSearch =
        s.name?.toLowerCase().includes(q) ||
        s.matric?.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "ALL" ||
        s.status?.toUpperCase() === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, activeStudents, graduates]);

  /* ==========================================
     LOGOUT
  ========================================== */
  function handleLogout() {
    localStorage.clear();
    router.push("/login");
  }

  if (!checked) return <div className="p-10">Checking...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:static z-50
          w-72 h-full bg-slate-900 text-white p-6
          transform transition
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <button
          className="lg:hidden mb-4"
          onClick={() => setSidebarOpen(false)}
        >
          ✕
        </button>

        <h1 className="text-2xl font-bold mb-6">PPBMS</h1>

        <button onClick={() => setActiveMenu("dashboard")}>Dashboard</button>
        <button onClick={() => setActiveMenu("students")}>Students</button>

        <div className="mt-auto">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between">
          <button
            className="lg:hidden bg-white p-3 rounded"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>

        {/* PROGRAMME */}
        <select
          value={programme}
          onChange={(e) => setProgramme(e.target.value)}
          className="p-3 border rounded"
        >
          <option value="">Select Programme</option>
          {programmes.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>

        {/* STUDENTS */}
        {activeMenu === "students" && (
          <>
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-3 border w-full"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-3 border w-full mt-2"
            >
              <option value="ALL">All</option>
              <option value="ON_TRACK">On Track</option>
              <option value="SLIGHTLY_DELAYED">Delayed</option>
              <option value="AT_RISK">At Risk</option>
              <option value="GRADUATED">Graduated</option>
            </select>

            <div className="bg-white mt-4 p-4 rounded">
              {students.map((s, i) => (
                <div key={i} className="flex justify-between border-b py-3">
                  <div>{s.name}</div>
                  <StatusBadge status={s.status} />
                  <Link href={`/admin/student/${s.email}`}>View</Link>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
