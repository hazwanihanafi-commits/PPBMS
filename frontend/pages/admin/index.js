// ==========================================
// FINAL PPBMS ADMIN DASHBOARD (FULL CLEAN)
// ==========================================

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { apiGet } from "@/utils/api";

/* ================= CARD ================= */
function Card({ title, value, color }) {
  return (
    <div className={`p-5 rounded-2xl shadow-sm ${color}`}>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

/* ================= STATUS BADGE ================= */
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

/* ================= PAGE ================= */
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

  /* ================= AUTH ================= */
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

  /* ================= LOAD PROGRAMMES ================= */
  useEffect(() => {
    if (!checked) return;

    apiGet("/api/admin/programmes/students")
      .then((d) => setProgrammes(d.programmes || []))
      .catch(() => setProgrammes([]));
  }, [checked]);

  /* ================= LOAD DATA ================= */
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

  /* ================= FILTER ================= */
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

  /* ================= LOGOUT ================= */
  function handleLogout() {
    localStorage.clear();
    router.push("/login");
  }

  if (!checked) return <div className="p-10">Checking...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* OVERLAY */}
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
          w-64 h-full bg-slate-900 text-white p-6
          transform transition duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <h1 className="text-2xl font-bold mb-6">PPBMS</h1>

        <div className="space-y-2">
          <button onClick={() => setActiveMenu("dashboard")} className="block w-full text-left">Dashboard</button>
          <button onClick={() => setActiveMenu("students")} className="block w-full text-left">Students</button>
        </div>

        <div className="mt-10">
          <button onClick={handleLogout} className="text-red-400">
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <button
            className="lg:hidden bg-white p-3 rounded shadow"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <h1 className="text-xl md:text-2xl font-bold">
            Admin Dashboard
          </h1>
        </div>

        {/* PROGRAMME */}
        <select
          value={programme}
          onChange={(e) => setProgramme(e.target.value)}
          className="p-3 border rounded w-full"
        >
          <option value="">Select Programme</option>
          {programmes.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>

        {/* ================= DASHBOARD ================= */}
        {activeMenu === "dashboard" && (
          <>
            {!programme ? (
              <div className="text-center text-gray-400 mt-10">
                Select a programme to view dashboard
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card title="On Track" value={summary.onTrack || 0} color="bg-green-100" />
                <Card title="Delayed" value={summary.slightlyDelayed || 0} color="bg-orange-100" />
                <Card title="At Risk" value={summary.atRisk || 0} color="bg-red-100" />
                <Card title="Graduated" value={summary.graduated || 0} color="bg-blue-100" />
              </div>
            )}
          </>
        )}

        {/* ================= STUDENTS ================= */}
        {activeMenu === "students" && (
          <>
            <input
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-3 border w-full rounded"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-3 border w-full mt-2 rounded"
            >
              <option value="ALL">All</option>
              <option value="ON_TRACK">On Track</option>
              <option value="SLIGHTLY_DELAYED">Delayed</option>
              <option value="AT_RISK">At Risk</option>
              <option value="GRADUATED">Graduated</option>
            </select>

            <div className="bg-white mt-4 p-4 rounded shadow-sm">
              {students.map((s, i) => (
                <div key={i} className="flex justify-between items-center border-b py-3">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.matric}</p>
                  </div>

                  <StatusBadge status={s.status} />

                  <Link
                    href={`/admin/student/${encodeURIComponent(s.email)}`}
                    className="text-purple-600"
                  >
                    View
                  </Link>
                </div>
              ))}

              {!students.length && (
                <p className="text-center text-gray-400 mt-4">
                  No students found
                </p>
              )}
            </div>
          </>
        )}

      </main>
    </div>
  );
}
