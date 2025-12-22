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

  // ✅ default programme for dashboard summary
  const [programme, setProgramme] = useState("Doctor of Philosophy");
  const [programmePLO, setProgrammePLO] = useState(null);

  /* =========================
     LOAD DATA
  ========================== */
  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    fetchProgrammePLO();
  }, [programme]);

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
     FETCH PROGRAMME PLO (SUMMARY)
  ========================== */
  async function fetchProgrammePLO() {
    try {
      const token = localStorage.getItem("ppbms_token");
      const params = new URLSearchParams({ programme });

      const res = await fetch(
        `${API_BASE}/api/admin/programme-plo?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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
    if (progress < 50)
      return <span className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full">At Risk</span>;
    if (progress < 80)
      return <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">Slightly Late</span>;
    return <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">On Track</span>;
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              📊 Programme-level PLO Attainment (CQI)
            </h2>

            <select
              value={programme}
              onChange={(e) => setProgramme(e.target.value)}
              className="border rounded px-3 py-1"
            >
              <option value="Doctor of Philosophy">PhD</option>
              <option value="Master of Science">MSc</option>
            </select>
          </div>

          {/* ✅ FIXED PROP */}
          <ProgrammePLOBarChart programmePLO={programmePLO} />
        </div>
      )}

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

            <p><strong>Email:</strong> {st.email}</p>
            <p><strong>Programme:</strong> {st.programme}</p>

            <div className="mt-3">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{st.progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
                <div
                  className={`h-2 rounded-full ${progressBarColor(st.progressPercent)}`}
                  style={{ width: `${st.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button
                onClick={() => router.push(`/supervisor/${encodeURIComponent(st.email)}`)}
                className="text-purple-700 font-semibold hover:underline"
              >
                View Full Student Record →
              </button>

              <button
                onClick={() =>
                  router.push(
                    `/admin/programme-plo?programme=${encodeURIComponent(st.programme)}`
                  )
                }
                className="text-blue-700 font-semibold hover:underline"
              >
                View Programme PLO →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
