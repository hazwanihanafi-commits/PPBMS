import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import { useRouter } from "next/router";

/* =========================
   TOP BAR (SUPERVISOR)
========================= */
function SupervisorTopBar() {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("ppbms_token");
    localStorage.removeItem("ppbms_role");
    router.push("/login");
  }

  return (
    <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <span className="text-xl font-extrabold text-purple-700">
          PPBMS
        </span>
        <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
          SUPERVISOR
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

export default function SupervisorDashboard() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD STUDENTS
  ========================= */
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
      console.error("Load students error:", e);
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

  /* =========================
     BADGES & COLORS
  ========================= */
  function registryBadge(status) {
    return status === "Graduated" ? (
      <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">
        Graduated
      </span>
    ) : (
      <span className="px-3 py-1 text-xs font-bold bg-gray-100 text-gray-700 rounded-full">
        Active
      </span>
    );
  }

  function progressBadge(progress) {
    if (progress < 50)
      return (
        <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full">
          At Risk
        </span>
      );
    if (progress < 80)
      return (
        <span className="px-3 py-1 text-xs font-bold bg-yellow-100 text-yellow-700 rounded-full">
          Slightly Late
        </span>
      );
    return (
      <span className="px-3 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full">
        On Track
      </span>
    );
  }

  function progressBarColor(progress) {
    if (progress < 50) return "bg-red-500";
    if (progress < 80) return "bg-yellow-500";
    return "bg-green-500";
  }

  /* ========================= */

  return (
    <>
      <SupervisorTopBar />

      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">

        <h1 className="text-3xl font-extrabold text-purple-900 mb-6">
          Supervisor Dashboard
        </h1>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search student…"
          className="w-full p-3 border rounded-xl bg-white mb-4"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* FILTERS */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["All", "On Track", "Slightly Late", "At Risk", "Graduated"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition
  ${
    statusFilter === s
      ? "bg-purple-600 text-white shadow"
      : "bg-purple-100 text-purple-700 hover:bg-purple-200"
  }
`}

              >
                {s}
              </button>
            )
          )}
        </div>

        {loading && <p className="text-gray-600">Loading students…</p>}

        {/* STUDENT CARDS */}
        {filtered.map((st) => {
  const isGraduated = st.status === "Graduated";

  return (
    <div
      key={st.email}
      className={`relative rounded-2xl p-6 shadow-md transition hover:shadow-xl
        ${
          isGraduated
            ? "bg-gradient-to-br from-green-50 to-white border border-green-200"
            : st.progressPercent < 50
            ? "bg-gradient-to-br from-red-50 to-white border border-red-200"
            : st.progressPercent < 80
            ? "bg-gradient-to-br from-yellow-50 to-white border border-yellow-200"
            : "bg-white border border-gray-200"
        }
      `}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 uppercase">
            {st.name}
          </h2>
          <p className="text-sm text-gray-500">{st.programme}</p>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full
              ${
                isGraduated
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }
            `}
          >
            {isGraduated ? "Graduated" : "Active"}
          </span>

          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full
              ${
                st.progressPercent < 50
                  ? "bg-red-100 text-red-700"
                  : st.progressPercent < 80
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }
            `}
          >
            {st.progressPercent < 50
              ? "At Risk"
              : st.progressPercent < 80
              ? "Slightly Late"
              : "On Track"}
          </span>
        </div>
      </div>

      {/* INFO */}
      <div className="space-y-1 text-sm text-gray-700">
        <p>
          <strong>Email:</strong> {st.email}
        </p>
        <p>
          <strong>Matric:</strong> {st.id || "-"}
        </p>
      </div>

      {/* PROGRESS */}
      <div className="mt-5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold text-gray-800">
            Overall Progress
          </span>
          <span className="text-sm font-bold text-purple-700">
            {st.progressPercent}%
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500
              ${
                st.progressPercent < 50
                  ? "bg-red-500"
                  : st.progressPercent < 80
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }
            `}
            style={{ width: `${st.progressPercent}%` }}
          />
        </div>
      </div>

      {/* ACTION */}
      <button
        onClick={() =>
          router.push({
            pathname: "/supervisor/[email]",
            query: { email: st.email.trim().toLowerCase() },
          })
        }
        className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-purple-700 hover:underline"
      >
        View Full Progress →
      </button>
    </div>
  );
})}

        </div>
      </div>
    </>
  );
}
