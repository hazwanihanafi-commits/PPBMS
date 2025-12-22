import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import ProgrammePLOBarChart from "../../components/ProgrammePLOBarChart";

export default function AdminDashboard() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [programmePLO, setProgrammePLO] = useState(null);

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    loadStudents();
    loadProgrammePLO();
  }, []);

  useEffect(() => {
    const s = search.toLowerCase();
    setFiltered(
      students.filter(
        st =>
          st.name?.toLowerCase().includes(s) ||
          st.email?.toLowerCase().includes(s)
      )
    );
  }, [search, students]);

  async function loadStudents() {
    const res = await fetch(`${API_BASE}/api/supervisor/students`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
      },
    });
    const json = await res.json();
    setStudents(json.students || []);
    setFiltered(json.students || []);
  }

  async function loadProgrammePLO() {
    const res = await fetch(`${API_BASE}/api/admin/plo/programme`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
      },
    });
    const json = await res.json();
    setProgrammePLO(json.programmePLO);
  }

  /* ========================= */

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <h1 className="text-3xl font-extrabold text-purple-900 mb-6">
        Admin Dashboard – All Students
      </h1>

      {/* PROGRAMME CQI */}
      <ProgrammePLOBarChart data={programmePLO} />

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search student..."
        className="w-full p-3 mb-6 border rounded-xl"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* STUDENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(st => (
          <div
            key={st.email}
            className="bg-white p-6 rounded-2xl shadow"
          >
            <h2 className="font-bold text-lg">{st.name}</h2>
            <p>Email: {st.email}</p>
            <p>Programme: {st.programme}</p>

            <div className="mt-3">
              <div className="flex justify-between text-sm font-semibold">
                <span>Overall Progress</span>
                <span>{st.progressPercent}%</span>
              </div>
              <div className="bg-gray-200 h-2 rounded-full">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${st.progressPercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={() =>
                router.push(`/supervisor/${encodeURIComponent(st.email)}`)
              }
              className="mt-4 text-purple-700 font-semibold"
            >
              View Full Student Record →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
