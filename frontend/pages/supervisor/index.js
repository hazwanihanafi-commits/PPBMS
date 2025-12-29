import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import { useRouter } from "next/router";

export default function SupervisorDashboard() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD STUDENTS
  ========================= */
  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, students]);

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

    setFiltered(list);
  }

  /* =========================
     BADGES & COLORS
  ========================= */

  function registryBadge(status) {
    if (status === "Graduated") {
      return (
        <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">
          Graduated
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-bold bg-gray-100 text-gray-700 rounded-full">
        Active
      </span>
    );
  }

  function progressBadge(progress) {
    if (progress < 50) {
      return (
        <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full">
          At Risk
        </span>
      );
    }
    if (progress < 80) {
      return (
        <span className="px-3 py-1 text-xs font-bold bg-yellow-100 text-yellow-700 rounded-full">
          Slightly Late
        </span>
      );
    }
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <h1 className="text-3xl font-extrabold text-purple-900 mb-6">
        Supervisor Dashboard
      </h1>

      {/* SEARCH */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search student…"
          className="flex-1 p-3 border rounded-xl bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="text-gray-600">Loading students…</p>}

      {/* STUDENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((st) => (
          <div
            key={st.email}
            className="bg-white p-6 rounded-2xl shadow border border-gray-100"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-gray-900 uppercase">
                {st.name}
              </h2>

              <div className="flex gap-2">
                {registryBadge(st.status)}
                {progressBadge(st.progressPercent)}
              </div>
            </div>

            {/* BASIC INFO */}
            <p className="text-sm text-gray-700">
              <strong>Email:</strong> {st.email}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Matric:</strong> {st.id || "-"}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Programme:</strong> {st.programme || "-"}
            </p>

            {st.coSupervisors && (
              <p className="text-sm text-gray-700">
                <strong>Co-Supervisor(s):</strong> {st.coSupervisors}
              </p>
            )}

            {/* OVERALL PROGRESS */}
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-800">
                Overall Progress
              </p>
              <p className="text-2xl font-extrabold text-purple-700">
                {st.progressPercent}%
              </p>
            </div>

            {/* PROGRESS BAR */}
            <div className="mt-2 w-full bg-gray-200 h-2 rounded-full">
              <div
                className={`h-2 rounded-full ${progressBarColor(
                  st.progressPercent
                )}`}
                style={{ width: `${st.progressPercent}%` }}
              />
            </div>

            <p className="text-right text-purple-700 font-semibold mt-1">
              {st.progressPercent}% Progress
            </p>

            {/* ACTION */}
<button
  onClick={() =>
    router.push({
      pathname: "/supervisor/[email]",
      query: { email: st.email.trim().toLowerCase() }
    })
  }
  className="mt-4 text-purple-700 font-medium hover:underline"
>
  View Full Progress →
</button>
          
          </div>
        ))}
      </div>
    </div>
  );
}
