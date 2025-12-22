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

  // 🔑 MUST MATCH GOOGLE SHEET PROGRAMME NAME
  const [programme, setProgramme] = useState("Doctor of Philosophy");
  const [programmePLO, setProgrammePLO] = useState(null);

  /* =========================
     LOAD STUDENTS
  ========================== */
  useEffect(() => {
    loadStudents();
  }, []);

  /* =========================
     LOAD PROGRAMME PLO
  ========================== */
  useEffect(() => {
    fetchProgrammePLO();
  }, [programme]);

  /* =========================
     FILTER
  ========================== */
  useEffect(() => {
    applyFilters();
  }, [search, students]);

  async function loadStudents() {
    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(`${API_BASE}/api/supervisor/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      setStudents(json.students || []);
    } catch (e) {
      console.error("Load students error:", e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProgrammePLO() {
  try {
    const token = localStorage.getItem("ppbms_token");

    const res = await fetch(
      `${API_BASE}/api/admin/programme-plo?programme=${encodeURIComponent(programme)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const json = await res.json();
    console.log("Programme PLO RAW:", json);

    const rawProgramme =
      json.programmes?.[programme] ||
      Object.values(json.programmes || {})[0];

    if (!rawProgramme) {
      setProgrammePLO(null);
      return;
    }

    // ✅ CONVERT OBJECT → ARRAY (THIS WAS MISSING)
    const formatted = Object.entries(rawProgramme).map(
      ([plo, v]) => ({
        plo,
        average: v.average,
        status: v.status,
      })
    );

    setProgrammePLO(formatted);
  } catch (err) {
    console.error("Programme PLO error:", err);
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
          st.email?.toLowerCase().includes(s) ||
          st.programme?.toLowerCase().includes(s)
      );
    }
    setFiltered(list);
  }

  function riskBadge(progress) {
    if (progress < 50)
      return (
        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
          At Risk
        </span>
      );
    if (progress < 80)
      return (
        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
          Slightly Late
        </span>
      );
    return (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
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
          PROGRAMME-LEVEL PLO (CQI)
      ========================== */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            📊 Programme-level PLO Attainment (CQI)
          </h2>

          <select
            value={programme}
            onChange={(e) => setProgramme(e.target.value)}
            className="border px-3 py-1 rounded"
          >
            <option value="Doctor of Philosophy">PhD</option>
            <option value="Master of Science">MSc</option>
          </select>
        </div>

        {programmePLO ? (
          <ProgrammePLOBarChart programmePLO={programmePLO} />
        ) : (
          <p className="text-sm italic text-gray-500">
            No programme-level PLO data available.
          </p>
        )}
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search student…"
        className="w-full p-3 border rounded-xl bg-white mb-6"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Loading students…</p>}

      {/* STUDENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((st) => (
          <div key={st.email} className="bg-white p-6 rounded-2xl shadow">
            <div className="flex justify-between mb-2">
              <h2 className="font-bold uppercase">{st.name}</h2>
              {riskBadge(st.progressPercent)}
            </div>

            <p>
              <strong>Email:</strong> {st.email}
            </p>
            <p>
              <strong>Programme:</strong> {st.programme}
            </p>

            <div className="mt-3">
              <div className="flex justify-between text-sm">
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

            <div className="mt-4">
              <button
                onClick={() =>
                  router.push(`/supervisor/${encodeURIComponent(st.email)}`)
                }
                className="text-purple-700 font-semibold hover:underline"
              >
                View Full Student Record →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
