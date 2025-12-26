import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

import ProgrammeCQISummary from "@/components/cqi/ProgrammeCQISummary";
import PLOAttainmentList from "@/components/cqi/PLOAttainmentList";

export default function AdminDashboard() {
  const router = useRouter();

  /* =========================
     STATES
  ========================= */
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ SIMPLE programme list
  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");
  const [programmePLO, setProgrammePLO] = useState(null);

  /* =========================
     LOAD PROGRAMMES
  ========================= */
  useEffect(() => {
    loadProgrammes();
  }, []);

  async function loadProgrammes() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/programmes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const data = await res.json();
      const list = data.programmes || [];

      setProgrammes(list);

      // auto-select first programme
      if (list.length > 0) {
        setProgramme(list[0]);
      }
    } catch (e) {
      console.error("Programme list error:", e);
    }
  }

  /* =========================
     LOAD PROGRAMME CQI
  ========================= */
  useEffect(() => {
    if (programme) fetchProgrammePLO();
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
    }
    setLoading(false);
  }

  /* =========================
     SEARCH FILTER
  ========================= */
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

  /* =========================
     TRANSFORM CQI DATA
  ========================= */
  const ploList = programmePLO
    ? Object.entries(programmePLO).map(([plo, d]) => ({
        plo,
        achieved: d.achieved,
        assessed: d.assessed,
        percent: d.percent,
        status: d.status,
      }))
    : [];

  const summary = {
    red: ploList.filter(p => p.status === "CQI Required"),
    yellow: ploList.filter(p => p.status === "Borderline"),
    green: ploList.filter(p => p.status === "Achieved"),
    risk:
      ploList.some(p => p.status === "CQI Required")
        ? "HIGH"
        : ploList.some(p => p.status === "Borderline")
        ? "MODERATE"
        : "LOW",
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="min-h-screen bg-purple-50 p-6">

      <h1 className="text-3xl font-extrabold text-purple-900 mb-6">
        Admin Dashboard – Programme CQI & Student Monitoring
      </h1>

      {/* ================= PROGRAMME DROPDOWN ================= */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <label className="text-sm font-semibold text-gray-700 block mb-2">
          Select Programme
        </label>

        <select
          value={programme}
          onChange={(e) => setProgramme(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          {programmes.map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* ================= PROGRAMME CQI ================= */}
      {programmePLO && (
        <>
          <ProgrammeCQISummary summary={summary} />
          <PLOAttainmentList ploData={ploList} />
        </>
      )}

      {/* ================= SEARCH ================= */}
      <input
        type="text"
        placeholder="Search student…"
        className="w-full mb-6 p-3 border rounded-xl bg-white"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Loading students…</p>}

      {/* ================= STUDENT CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(st => (
          <div key={st.email} className="bg-white p-6 rounded-2xl shadow">
            <h2 className="font-bold">{st.name}</h2>
            <p className="text-sm">{st.email}</p>

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
