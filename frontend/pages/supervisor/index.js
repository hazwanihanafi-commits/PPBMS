import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import { useRouter } from "next/router";

/* =========================
   TOP BAR
========================= */
function SupervisorTopBar() {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("ppbms_token");
    localStorage.removeItem("ppbms_role");
    router.push("/login");
  };

  return (
    <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <span className="text-xl font-extrabold text-purple-700">PPBMS</span>
        <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
          SUPERVISOR PANEL
        </span>
      </div>

      <button
        onClick={logout}
        className="text-sm font-semibold text-red-600 hover:underline"
      >
        Logout
      </button>
    </div>
  );
}

/* ========================= */

export default function SupervisorDashboard() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, students, statusFilter]);

  async function loadStudents() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/supervisor/students`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const json = await res.json();
      setStudents(res.ok ? json.students || [] : []);
    } catch (e) {
      console.error(e);
      setStudents([]);
    }
    setLoading(false);
  }

  function applyFilters() {
    let list = [...students];

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (st) =>
          st.name?.toLowerCase().includes(s) ||
          st.email?.toLowerCase().includes(s) ||
          st.programme?.toLowerCase().includes(s)
      );
    }

    if (statusFilter !== "All") {
      list = list.filter((st) => {
        if (statusFilter === "Graduated") return st.status === "Graduated";
        if (statusFilter === "On Track") return st.progressPercent >= 80;
        if (statusFilter === "Slightly Late")
          return st.progressPercent >= 50 && st.progressPercent < 80;
        if (statusFilter === "At Risk") return st.progressPercent < 50;
        return true;
      });
    }

    setFiltered(list);
  }

  /* ================= KPI ================= */

  const total = students.length;
  const atRisk = students.filter((s) => s.progressPercent < 50).length;
  const slightlyLate = students.filter(
    (s) => s.progressPercent >= 50 && s.progressPercent < 80
  ).length;
  const onTrack = students.filter((s) => s.progressPercent >= 80).length;

  function progressColor(p) {
    if (p < 50) return "bg-red-500";
    if (p < 80) return "bg-yellow-500";
    return "bg-green-500";
  }

  function progressLabel(p) {
    if (p < 50) return "At Risk";
    if (p < 80) return "Slightly Delayed";
    return "On Track";
  }

  /* ================= UI ================= */

  return (
    <>
      <SupervisorTopBar />

      <div className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#ede9fe] p-6 space-y-6 text-gray-800">

        {/* HEADER */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white p-6 shadow-xl">
          <h1 className="text-2xl font-semibold tracking-tight">
            Supervisor Monitoring Dashboard
          </h1>
          <p className="text-sm text-purple-100">
            Overview of postgraduate research progress under your supervision
          </p>
        </div>

        {/* KPI CARDS */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-5 shadow">
            <p className="text-sm text-gray-500">Total Students</p>
            <h2 className="text-2xl font-bold">{total}</h2>
          </div>

          <div className="bg-green-50 rounded-2xl p-5 shadow">
            <p className="text-sm text-gray-500">On Track</p>
            <h2 className="text-2xl font-bold text-green-700">{onTrack}</h2>
          </div>

          <div className="bg-yellow-50 rounded-2xl p-5 shadow">
            <p className="text-sm text-gray-500">Slightly Delayed</p>
            <h2 className="text-2xl font-bold text-yellow-700">{slightlyLate}</h2>
          </div>

          <div className="bg-red-50 rounded-2xl p-5 shadow">
            <p className="text-sm text-gray-500">At Risk</p>
            <h2 className="text-2xl font-bold text-red-700">{atRisk}</h2>
          </div>
        </div>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search by name, email, or programme..."
          className="w-full p-3 rounded-xl border bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* FILTER */}
        <div className="flex gap-2 flex-wrap">
          {["All", "On Track", "Slightly Late", "At Risk", "Graduated"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  statusFilter === s
                    ? "bg-purple-600 text-white"
                    : "bg-white border"
                }`}
              >
                {s}
              </button>
            )
          )}
        </div>

        {loading && <p>Loading students...</p>}

        {/* STUDENTS */}
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((st) => (
            <div
              key={st.email}
              className="bg-white/60 backdrop-blur rounded-2xl p-6 shadow hover:shadow-xl transition"
            >
              <div className="flex justify-between mb-3">
                <div>
                  <h2 className="font-semibold uppercase">{st.name}</h2>
                  <p className="text-sm text-gray-500">{st.programme}</p>
                </div>

                <div className="text-right text-sm">
                  <p>{st.status}</p>
                  <p className="text-purple-700 font-semibold">
                    {progressLabel(st.progressPercent)}
                  </p>
                </div>
              </div>

              <p className="text-sm"><strong>Email:</strong> {st.email}</p>
              <p className="text-sm"><strong>Matric:</strong> {st.id || "-"}</p>

              <div className="mt-4">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Overall Progress</span>
                  <span>{st.progressPercent}%</span>
                </div>

                <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                  <div
                    className={`h-2 rounded-full ${progressColor(
                      st.progressPercent
                    )}`}
                    style={{ width: `${st.progressPercent}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() =>
                  router.push({
                    pathname: "/supervisor/[email]",
                    query: { email: st.email },
                  })
                }
                className="mt-4 text-purple-700 font-medium hover:underline"
              >
                View Detailed Progress →
              </button>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <footer className="text-center text-xs text-gray-400 py-6 border-t mt-10">
          © 2026 PPBMS · Universiti Sains Malaysia  
          <br />
          Developed by <span className="font-medium text-gray-600">Hazwani Ahmad Yusof</span> (2025)
        </footer>

      </div>
    </>
  );
}
