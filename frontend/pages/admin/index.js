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

  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState(null);
  const [programmePLO, setProgrammePLO] = useState(null);

  /* =========================
     LOAD PROGRAMMES (ONCE)
  ========================= */
  useEffect(() => {
    fetchProgrammes();
  }, []);

  async function fetchProgrammes() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/programmes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const data = await res.json();
      setProgrammes(data.programmes || []);
      setProgramme(data.programmes?.[0] || null);
    } catch (e) {
      console.error("Failed to load programmes", e);
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
        (st) =>
          st.name?.toLowerCase().includes(s) ||
          st.email?.toLowerCase().includes(s)
      )
    );
  }, [search, students]);

  /* =========================
     TRANSFORM CQI DATA
  ========================= */
  const ploList = programmePLO
    ? Object.entries(programmePLO).map(([plo, d]) => {
        const percent =
          typeof d.percent === "number"
            ? d.percent
            : typeof d.attainmentPercent === "number"
            ? d.attainmentPercent
            : d.assessed
            ? Math.round((d.achieved / d.assessed) * 100)
            : 0;

        return {
          plo,
          achieved: d.achieved ?? 0,
          assessed: d.assessed ?? 0,
          percent,
          status: d.status || (percent >= 70 ? "Achieved" : "CQI Required"),
          actions: [
            "Strengthen supervisory intervention",
            "Reinforce rubric alignment",
            "Monitor progress in next academic cycle",
          ],
        };
      })
    : [];

  const summary = {
    red: ploList.filter(p => p.status === "CQI Required").length,
    yellow: ploList.filter(p => p.status === "Borderline").length,
    green: ploList.filter(p => p.status === "Achieved").length,
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

      {/* ================= PROGRAMME SELECTOR ================= */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-purple-900">
          📊 Programme-level PLO Attainment (CQI)
        </h2>

        <select
          value={programme || ""}
          onChange={(e) => setProgramme(e.target.value)}
          className="border rounded-lg px-3 py-1 text-sm bg-white"
        >
          {programmes.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

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
        className="w-full my-6 p-3 border rounded-xl bg-white"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Loading students…</p>}

      {/* ================= STUDENT CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((st) => (
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
