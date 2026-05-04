import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { apiGet } from "@/utils/api";

/* ==========================================
   STATUS BADGE
========================================== */
function StatusBadge({ status }) {
  const map = {
    "On Track": "bg-green-100 text-green-700",
    "Slightly Late": "bg-yellow-100 text-yellow-700",
    "At Risk": "bg-red-100 text-red-700",
    "Graduated": "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

/* ==========================================
   PAGE
========================================== */
export default function AdminDashboard() {

  const router = useRouter();

  /* ================= STATE ================= */
  const [checked, setChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");

  const [graduates, setGraduates] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);

  const [summary, setSummary] = useState({
    onTrack: 0,
    slightlyDelayed: 0,
    atRisk: 0,
    graduated: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

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
      .then(d => setProgrammes(d.programmes || []))
      .catch(() => setProgrammes([]));
  }, [checked]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!programme) return;

    setLoading(true);

    Promise.all([
      apiGet(`/api/admin/programme-active-students?programme=${programme}`),
      apiGet(`/api/admin/programme-graduates?programme=${programme}`),
      apiGet(`/api/admin/programme-summary?programme=${programme}`),
    ])
      .then(([active, grad, sum]) => {
        setActiveStudents(active.students || []);
        setGraduates(grad.students || []);
        setSummary(sum || {});
      })
      .finally(() => setLoading(false));

  }, [programme]);

  /* ================= CATEGORY (FIXED) ================= */
function getStudentCategory(st) {

  /* =========================
     1. HANDLE GRADUATED
  ========================= */
  const rawStatus = String(st.status || "").toLowerCase().trim();

  if (
    rawStatus === "graduated" ||
    rawStatus === "completed"
  ) {
    return "Graduated";
  }

  /* =========================
     2. USE PROGRESS (MAIN LOGIC)
  ========================= */
  const progress = Number(st.progressPercent || 0);

  if (progress >= 80) {
    return "On Track";
  }

  if (progress >= 50) {
    return "Slightly Late";
  }

  return "At Risk";
}

  /* ================= FILTER ================= */
  const students = useMemo(() => {

    const all = [...activeStudents, ...graduates];

    return all.filter(st => {

      const q = search.toLowerCase();

      const matchSearch =
        st.name?.toLowerCase().includes(q) ||
        st.matric?.toLowerCase().includes(q) ||
        st.email?.toLowerCase().includes(q);

      const category = getStudentCategory(st);

      const matchStatus =
        statusFilter === "All" ||
        category === statusFilter;

      return matchSearch && matchStatus;
    });

  }, [search, statusFilter, activeStudents, graduates]);

  /* ================= LOGOUT ================= */
  function logout() {
    localStorage.clear();
    router.push("/login");
  }

  /* ================= LOADING ================= */
  if (!checked) {
    return <div className="p-6">Checking access...</div>;
  }

  /* ================= UI ================= */
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
      <aside className={`
        fixed lg:static z-50
        w-64 h-full bg-gradient-to-b from-indigo-900 to-purple-800
        text-white p-6 space-y-6
        transform transition
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        <h2 className="text-xl font-bold">PPBMS</h2>

        <button onClick={logout} className="text-red-300 text-sm">
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <button
            className="lg:hidden bg-white p-3 rounded"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
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
          {programmes.map(p => (
            <option key={p}>{p}</option>
          ))}
        </select>

        {/* SUMMARY */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <div className="bg-green-100 p-4 rounded-xl">
            <p>On Track</p>
            <h2 className="text-2xl font-bold">{summary.onTrack}</h2>
          </div>

          <div className="bg-yellow-100 p-4 rounded-xl">
            <p>Slightly Late</p>
            <h2 className="text-2xl font-bold">{summary.slightlyDelayed}</h2>
          </div>

          <div className="bg-red-100 p-4 rounded-xl">
            <p>At Risk</p>
            <h2 className="text-2xl font-bold">{summary.atRisk}</h2>
          </div>

          <div className="bg-blue-100 p-4 rounded-xl">
            <p>Graduated</p>
            <h2 className="text-2xl font-bold">{summary.graduated}</h2>
          </div>

        </div>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search..."
          className="w-full p-3 border rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* FILTER */}
        <div className="flex flex-wrap gap-2">
          {["All","On Track","Slightly Late","At Risk","Graduated"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-sm ${
                statusFilter === s
                  ? "bg-purple-600 text-white"
                  : "bg-white border"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="bg-white rounded-xl shadow divide-y">

          {loading && (
            <div className="p-6 text-center">Loading...</div>
          )}

          {!loading && students.map((s, i) => {

            const category = getStudentCategory(s);

            return (
              <div key={i} className="p-4 flex justify-between items-center">

                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={category} />

                  <Link
                    href={`/admin/student/${encodeURIComponent(s.email)}`}
                    className="text-purple-600 text-sm font-semibold"
                  >
                    View →
                  </Link>
                </div>

              </div>
            );
          })}

          {!loading && students.length === 0 && (
            <div className="p-6 text-center text-gray-400">
              No students found
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
