// ==========================================
// PPBMS ADMIN DASHBOARD (UPGRADED PRO)
// ==========================================

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
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
   STATUS BADGE
========================================== */
function StatusBadge({ status }) {
  const s = status?.toUpperCase();

  const map = {
    ON_TRACK: "bg-green-100 text-green-700",
    SLIGHTLY_DELAYED: "bg-yellow-100 text-yellow-700",
    AT_RISK: "bg-red-100 text-red-700",
    GRADUATED: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[s]}`}>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");

  const [summary, setSummary] = useState({});
  const [activeStudents, setActiveStudents] = useState([]);
  const [graduates, setGraduates] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(false);

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

    setLoading(true);

    Promise.all([
      apiGet(`/api/admin/programme-active-students?programme=${programme}`),
      apiGet(`/api/admin/programme-graduates?programme=${programme}`),
      apiGet(`/api/admin/programme-summary?programme=${programme}`)
    ])
      .then(([active, grad, sum]) => {
        setActiveStudents(active.students || []);
        setGraduates(grad.students || []);
        setSummary(sum || {});
      })
      .finally(() => setLoading(false));
  }, [programme]);

  /* ==========================================
     FILTER
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
     CHART DATA
  ========================================== */
  const pieData = [
    { name: "On Track", value: summary.onTrack || 0, color: "#16a34a" },
    { name: "Slightly Late", value: summary.slightlyDelayed || 0, color: "#eab308" },
    { name: "At Risk", value: summary.atRisk || 0, color: "#dc2626" },
    { name: "Graduated", value: summary.graduated || 0, color: "#2563eb" },
  ];

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

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:static z-50 w-64 h-full bg-slate-900 text-white p-6
        transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 transition
      `}>
        <h2 className="text-xl font-bold mb-6">PPBMS</h2>

        <button className="block mb-3">Dashboard</button>
        <button className="block mb-3">Students</button>

        <button onClick={handleLogout} className="mt-10 text-red-300">
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu />
          </button>

          <h1 className="text-2xl font-bold text-purple-700">
            Admin Dashboard
          </h1>
        </div>

        {/* PROGRAMME */}
        <select
          value={programme}
          onChange={(e) => setProgramme(e.target.value)}
          className="w-full p-3 border rounded-xl"
        >
          <option value="">Select Programme</option>
          {programmes.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-100 p-4 rounded-xl">On Track: {summary.onTrack || 0}</div>
          <div className="bg-yellow-100 p-4 rounded-xl">Late: {summary.slightlyDelayed || 0}</div>
          <div className="bg-red-100 p-4 rounded-xl">Risk: {summary.atRisk || 0}</div>
          <div className="bg-blue-100 p-4 rounded-xl">Graduated: {summary.graduated || 0}</div>
        </div>

        {/* PIE CHART */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-semibold mb-4">Programme Distribution</h3>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={80}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* SEARCH */}
        <input
          placeholder="Search student..."
          className="w-full p-3 border rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* FILTER BUTTONS */}
        <div className="flex gap-2 flex-wrap">
          {["ALL","ON_TRACK","SLIGHTLY_DELAYED","AT_RISK","GRADUATED"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1 rounded-full ${
                statusFilter === s ? "bg-purple-600 text-white" : "bg-gray-200"
              }`}
            >
              {s.replaceAll("_", " ")}
            </button>
          ))}
        </div>

        {/* STUDENT LIST */}
        <div className="bg-white rounded-xl shadow divide-y">

          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : students.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No students found
            </div>
          ) : (
            students.map((s, i) => (
              <div key={i} className="p-4 flex justify-between">

                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </div>

                <div className="flex gap-3 items-center">
                  <StatusBadge status={s.status} />

                  <Link href={`/admin/student/${s.email}`}>
                    View →
                  </Link>
                </div>

              </div>
            ))
          )}

        </div>

      </main>
    </div>
  );
}
