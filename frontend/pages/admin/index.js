import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import ProgrammePLOBarChart from "../../components/ProgrammePLOBarChart";

export default function AdminDashboard() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  /* =========================
     PROGRAMME-LEVEL PLO (CQI)
  ========================== */
  const [programmePLO, setProgrammePLO] = useState(null);

  /* =========================
     LOAD DATA
  ========================== */
  useEffect(() => {
    loadStudents();
    fetchProgrammePLO();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, students]);

  /* =========================
     FETCH STUDENTS
  ========================== */
  async function loadStudents() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/supervisor/students`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const json = await res.json();
      setStudents(json.students || []);
    } catch (e) {
      console.error("Admin load students error:", e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     FETCH PROGRAMME PLO (ADMIN SUMMARY)
  ========================== */
  async function fetchProgrammePLO() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/programme-plo`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const data = await res.json();
      setProgrammePLO(data.plo || null);
    } catch (e) {
      console.error("Programme PLO load error:", e);
      setProgrammePLO(null);
    }
  }

  /* =========================
     FILTERING
  ========================== */
  function applyFilters() {
    let list = [...students];

    if (search.trim() !== "") {
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
     UI HELPERS
  ========================== */
  function riskBadge(progress) {
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

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <h1 className="text-3xl font-extrabold text-purple-900 mb-6">
        Admin Dashboard – All Students
      </h1>

      {/* =========================
          PROGRAMME-LEVEL PLO CQI
      ========================== */}
      {programmePLO && (
        <div className="bg-white rounded-2xl shadow p-6 mb-10">
          <h2 className="text-xl font-bold mb-4">
            📊 Programme-level PLO Attainment (CQI)
          </h2>

          <ProgrammePLOBarChart plo={programmePLO} />
        </div>
      )}

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

      {/* =========================
          STUDENT CARDS
      ========================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((st) => (
          <div
            key={st.email}
            className="bg-white p-6 rounded-2xl shadow border border-gray-100"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-gray-900 uppercase">
                {st.name}
              </h2>
              {riskBadge(st.progressPercent)}
            </div>

            <p className="text-sm text-gray-700">
              <strong>Email:</strong> {st.email}
            </p>

            <p className="text-sm text-gray-700">
              <strong>Programme:</strong> {st.programme}
            </p>

            <p className="text-sm text-gray-700">
              <strong>Status:</strong> {st.status || "Active"}
            </p>

            {st.coSupervisors && (
              <p className="text-sm text-gray-700 mt-1">
                <strong>Co-Supervisor(s):</strong> {st.coSupervisors}
              </p>
            )}

            {/* PROGRESS */}
            <div className="mt-4">
              <div className="flex justify-between text-sm font-semibold">
                <span>Overall Progress</span>
                <span>{st.progressPercent}%</span>
              </div>

              <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
                <div
                  className={`h-2 rounded-full ${progressBarColor(
                    st.progressPercent
                  )}`}
                  style={{ width: `${st.progressPercent}%` }}
                />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-4 mt-4">
              <button
                onClick={() =>
                  router.push(`/supervisor/${encodeURIComponent(st.email)}`)
                }
                className="text-purple-700 font-semibold hover:underline"
              >
                View Full Student Record →
              </button>

              <button
                onClick={() =>
                  router.push(
                    `/admin/programme-plo?programme=${encodeURIComponent(
                      st.programme
                    )}`
                  )
                }
                className="text-blue-700 font-semibold hover:underline"
              >
                View Programme PLO →
              </button>
            </div>
