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
        <span className="text-xl font-extrabold text-purple-700">
          PPBMS
        </span>

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

/* =========================
   MAIN PAGE
========================= */

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
  }, [students, search, statusFilter]);

  /* =========================
     LOAD STUDENTS
  ========================= */

  async function loadStudents() {
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/supervisor/students`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const json = await res.json();

      if (res.ok) {
        setStudents(json.students || []);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error(err);
      setStudents([]);
    }

    setLoading(false);
  }

  /* =========================
     CATEGORY LOGIC
  ========================= */

  function getStudentCategory(st) {
    // PRIORITY: GRADUATED / COMPLETED
    if (
      st.status?.toLowerCase() === "graduated" ||
      st.status?.toLowerCase() === "completed"
    ) {
      return "Graduated";
    }

    const p = st.progressPercent || 0;

    if (p >= 80) return "On Track";
    if (p >= 50) return "Slightly Late";

    return "At Risk";
  }

  /* =========================
     FILTERING
  ========================= */

  function applyFilters() {
    let list = [...students];

    // SEARCH
    if (search.trim()) {
      const s = search.toLowerCase();

      list = list.filter(
        (st) =>
          st.name?.toLowerCase().includes(s) ||
          st.email?.toLowerCase().includes(s) ||
          st.programme?.toLowerCase().includes(s)
      );
    }

    // STATUS FILTER
    if (statusFilter !== "All") {
      list = list.filter(
        (st) => getStudentCategory(st) === statusFilter
      );
    }

    setFiltered(list);
  }

  /* =========================
     KPI COUNTS
  ========================= */

  const total = students.length;

  const graduated = students.filter(
    (s) => getStudentCategory(s) === "Graduated"
  ).length;

  const onTrack = students.filter(
    (s) => getStudentCategory(s) === "On Track"
  ).length;

  const slightlyLate = students.filter(
    (s) => getStudentCategory(s) === "Slightly Late"
  ).length;

  const atRisk = students.filter(
    (s) => getStudentCategory(s) === "At Risk"
  ).length;

  /* =========================
     PROGRESS BAR COLOUR
  ========================= */

  function progressColor(st) {
    const category = getStudentCategory(st);

    if (category === "Graduated") return "bg-blue-500";
    if (category === "On Track") return "bg-green-500";
    if (category === "Slightly Late") return "bg-yellow-500";

    return "bg-red-500";
  }

  /* =========================
     STATUS TEXT COLOUR
  ========================= */

  function statusTextColor(st) {
    const category = getStudentCategory(st);

    if (category === "Graduated") return "text-blue-700";
    if (category === "On Track") return "text-green-700";
    if (category === "Slightly Late") return "text-yellow-700";

    return "text-red-700";
  }

  /* =========================
     CARD BACKGROUND
  ========================= */

  function cardBackground(st) {
    const category = getStudentCategory(st);

    if (category === "Graduated") {
      return "bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100";
    }

    if (category === "On Track") {
      return "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100";
    }

    if (category === "Slightly Late") {
      return "bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-100";
    }

    return "bg-gradient-to-br from-red-50 to-rose-50 border border-red-100";
  }

  /* =========================
     UI
  ========================= */

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

        {/* KPI */}
        <div className="grid md:grid-cols-5 gap-6">

          <div className="bg-white rounded-2xl p-5 shadow">
            <p className="text-sm text-gray-500">Total Students</p>
            <h2 className="text-2xl font-bold">{total}</h2>
          </div>

          <div className="bg-green-50 rounded-2xl p-5 shadow">
            <p className="text-sm text-gray-500">On Track</p>
            <h2 className="text-2xl font-bold text-green-700">
              {onTrack}
            </h2>
          </div>

          <div className="bg-yellow-50 rounded-2xl p-5 shadow">
            <p className="text-sm text-gray-500">Slightly Delayed</p>
            <h2 className="text-2xl font-bold text-yellow-700">
              {slightlyLate}
            </h2>
          </div>

          <div className="bg-red-50 rounded-2xl p-5 shadow">
            <p className="text-sm text-gray-500">At Risk</p>
            <h2 className="text-2xl font-bold text-red-700">
              {atRisk}
            </h2>
          </div>

          <div className="bg-blue-50 rounded-2xl p-5 shadow">
            <p className="text-sm text-gray-500">Graduated</p>
            <h2 className="text-2xl font-bold text-blue-700">
              {graduated}
            </h2>
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

        {/* FILTERS */}
        <div className="flex gap-2 flex-wrap">
          {[
            "All",
            "On Track",
            "Slightly Late",
            "At Risk",
            "Graduated",
          ].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                statusFilter === s
                  ? "bg-purple-600 text-white"
                  : "bg-white border hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* LOADING */}
        {loading && (
          <div className="bg-white rounded-2xl p-6 shadow text-center">
            Loading students...
          </div>
        )}

        {/* STUDENT LIST */}
        <div className="grid md:grid-cols-2 gap-6">

          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-2xl p-6 shadow">
              No students found.
            </div>
          )}

          {filtered.map((st) => (
            <div
              key={st.email}
              className={`rounded-2xl p-6 shadow hover:shadow-xl transition ${cardBackground(
                st
              )}`}
            >
              {/* TOP */}
              <div className="flex justify-between mb-4">

                <div>
                  <h2 className="font-bold uppercase text-lg">
                    {st.name}
                  </h2>

                  <p className="text-sm text-gray-600">
                    {st.programme}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {st.status || "-"}
                  </p>

                  <p
                    className={`font-bold ${statusTextColor(st)}`}
                  >
                    {getStudentCategory(st)}
                  </p>
                </div>

              </div>

              {/* INFO */}
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Email:</strong> {st.email}
                </p>

                <p>
                  <strong>Matric:</strong> {st.id || "-"}
                </p>
              </div>

              {/* PROGRESS */}
              <div className="mt-5">

                <div className="flex justify-between text-sm font-semibold">
                  <span>Overall Progress</span>
                  <span>{st.progressPercent || 0}%</span>
                </div>

                <div className="w-full h-3 bg-white/70 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${progressColor(
                      st
                    )}`}
                    style={{
                      width: `${st.progressPercent || 0}%`,
                    }}
                  />
                </div>

              </div>

              {/* BUTTON */}
              <button
                onClick={() =>
                  router.push({
                    pathname: "/supervisor/[email]",
                    query: { email: st.email },
                  })
                }
                className="mt-5 text-purple-700 font-semibold hover:underline"
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
          Developed by{" "}
          <span className="font-medium text-gray-600">
            Hazwani Ahmad Yusof
          </span>{" "}
          (2025)
        </footer>

      </div>
    </>
  );
}
