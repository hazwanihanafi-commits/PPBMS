import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

export default function AdminDashboard() {
  const router = useRouter();

  /* =========================
     STATES
  ========================= */
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Programme CQI
  const [programme, setProgramme] = useState("Doctor of Philosophy");
  const [programmePLO, setProgrammePLO] = useState(null);

  /* =========================
     LOAD STUDENTS
  ========================= */
  useEffect(() => {
    loadStudents();
  }, []);

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
      setFiltered(json.students || []);
    } catch (e) {
      console.error(e);
      setStudents([]);
      setFiltered([]);
    }
    setLoading(false);
  }

  /* =========================
     LOAD PROGRAMME PLO CQI
  ========================= */
  useEffect(() => {
    fetchProgrammePLO();
  }, [programme]);

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
      setProgrammePLO(data.programmes?.[programme] || null);
    } catch (e) {
      console.error("Programme PLO error:", e);
      setProgrammePLO(null);
    }
  }

  /* =========================
     FILTER
  ========================= */
  useEffect(() => {
    const s = search.toLowerCase();
    setFiltered(
      students.filter(
        (st) =>
          st.name?.toLowerCase().includes(s) ||
          st.email?.toLowerCase().includes(s)
      )
    );
  }, [search, students]);

  /* =========================
     HELPERS
  ========================= */
  function riskBadge(progress) {
    if (progress < 50)
      return <span className="badge bg-red">At Risk</span>;
    if (progress < 80)
      return <span className="badge bg-yellow">Slightly Late</span>;
    return <span className="badge bg-green">On Track</span>;
  }

  function progressColor(p) {
    if (p < 50) return "bg-red-500";
    if (p < 80) return "bg-yellow-500";
    return "bg-green-500";
  }

  /* =========================
     CQI ACTION STATEMENT
  ========================= */
  function renderCQIAction(plo, d) {
    if (d.status === "Achieved") {
      return (
        <p className="text-xs text-green-700 mt-1">
          ✔ Attainment target met. Current supervisory and assessment strategies
          are effective and will be maintained.
        </p>
      );
    }

    return (
      <p className="text-xs text-red-700 mt-1">
        ⚠ Less than 70% of students achieved <strong>{plo}</strong>.  
        Programme CQI action required: strengthen supervisory intervention,
        reinforce rubric alignment, and monitor progress in the next academic
        cycle.
      </p>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <h1 className="text-3xl font-extrabold text-purple-900 mb-6">
        Admin Dashboard – Programme CQI & Student Monitoring
      </h1>

      {/* =========================
          PROGRAMME-LEVEL CQI
      ========================= */}
      {programmePLO && Object.keys(programmePLO).length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-purple-900">
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

          {/* Legend */}
          <div className="flex gap-6 text-xs text-gray-600 mb-4">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded"></span>
              ≥70% Students Achieved
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded"></span>
              CQI Required
            </span>
          </div>

          {/* PLO BARS */}
          {Object.entries(programmePLO).map(([plo, d]) => (
            <div key={plo} className="mb-4">
              <div className="flex justify-between text-sm font-semibold">
                <span>{plo}</span>
                <span>
                  {d.attainmentPercent}% ({d.achievedStudents}/
                  {d.totalStudents})
                </span>
              </div>

              <div className="w-full bg-gray-200 h-2 rounded mt-1">
                <div
                  className={`h-2 rounded ${
                    d.status === "Achieved"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(d.attainmentPercent, 100)}%`,
                  }}
                />
              </div>

              {/* CQI ACTION */}
              {renderCQIAction(plo, d)}
            </div>
          ))}
        </div>
      )}

      {/* =========================
          SEARCH
      ========================= */}
      <input
        type="text"
        placeholder="Search student…"
        className="w-full mb-6 p-3 border rounded-xl bg-white"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p className="text-gray-600">Loading students…</p>}

      {/* =========================
          STUDENTS
      ========================= */}
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

            <p className="text-sm">
              <strong>Email:</strong> {st.email}
            </p>
            <p className="text-sm">
              <strong>Programme:</strong> {st.programme}
            </p>

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
