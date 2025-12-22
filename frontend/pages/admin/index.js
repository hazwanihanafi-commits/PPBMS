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

  // 🔥 Programme PLO
  const [programme, setProgramme] = useState("Doctor of Philosophy");
  const [programmePLO, setProgrammePLO] = useState(null);

  /* =========================
     LOAD STUDENTS
  ========================= */
  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, students]);

  /* =========================
     LOAD PROGRAMME PLO
  ========================= */
  useEffect(() => {
    fetchProgrammePLO();
  }, [programme]);

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
      console.error("Load students error:", e);
      setStudents([]);
    }
    setLoading(false);
  }

  async function fetchProgrammePLO() {
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/programme-plo?programme=${encodeURIComponent(
          programme
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
          },
        }
      );

      const data = await res.json();

      // ✅ EXACT BACKEND SHAPE
      setProgrammePLO(data.programmes?.[programme] || null);
    } catch (e) {
      console.error("Programme PLO error:", e);
      setProgrammePLO(null);
    }
  }

  function applyFilters() {
    let list = [...students];
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (st) =>
          st.name?.toLowerCase().includes(s) ||
          st.email?.toLowerCase().includes(s)
      );
    }
    setFiltered(list);
  }

  function riskBadge(progress) {
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

  function progressColor(p) {
    if (p < 50) return "bg-red-500";
    if (p < 80) return "bg-yellow-500";
    return "bg-green-500";
  }

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <h1 className="text-3xl font-extrabold text-purple-900 mb-6">
        Admin Dashboard – All Students
      </h1>

      {/* =========================
          PROGRAMME PLO BAR
      ========================= */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-purple-900">
            📊 Programme-level PLO Attainment (CQI)
          </h2>

          <select
            value={programme}
            onChange={(e) => setProgramme(e.target.value)}
            className="border rounded-lg px-3 py-1 text-sm"
          >
            <option>Doctor of Philosophy</option>
            <option>Master of Science</option>
          </select>
        </div>

        <ProgrammePLOBarChart data={programmePLO} />
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search student…"
        className="w-full mb-6 p-3 border rounded-xl bg-white"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Loading…</p>}

      {/* STUDENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((st) => (
          <div
            key={st.email}
            className="bg-white p-6 rounded-2xl shadow"
          >
            <div className="flex justify-between mb-2">
              <h2 className="font-bold">{st.name}</h2>
              {riskBadge(st.progressPercent)}
            </div>

            <p className="text-sm"><strong>Email:</strong> {st.email}</p>
            <p className="text-sm"><strong>Programme:</strong> {st.programme}</p>

            <div className="mt-4">
              <div className="flex justify-between text-sm font-semibold">
                <span>Overall Progress</span>
                <span>{st.progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
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
                router.push(`/supervisor/${encodeURIComponent(st.email)}`)
              }
              className="mt-4 text-purple-700 font-semibold hover:underline"
            >
              View Full Student Record →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
