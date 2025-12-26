import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import ProgrammeCQISummary from "@/components/cqi/ProgrammeCQISummary";
import PLOAttainmentList from "@/components/cqi/PLOAttainmentList";

export default function AdminDashboard() {
  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");
  const [programmePLO, setProgrammePLO] = useState(null);

  /* =========================
     LOAD PROGRAMMES
  ========================= */
  useEffect(() => {
    async function loadProgrammes() {
      const res = await fetch(`${API_BASE}/api/admin/programmes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      console.log("PROGRAMME STATUS:", res.status);

      const data = await res.json();
      console.log("PROGRAMMES DATA:", data);

      setProgrammes(data.programmes || []);
      if (data.programmes?.length) {
        setProgramme(data.programmes[0]);
      }
    }

    loadProgrammes();
  }, []);
  
  /* =========================
     LOAD CQI
  ========================= */
  useEffect(() => {
    if (!programme) return;

    async function loadCQI() {
      const res = await fetch(
        `${API_BASE}/api/admin/programme-plo?programme=${encodeURIComponent(programme)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
          },
        }
      );

      const data = await res.json();
      setProgrammePLO(data.programmes?.[programme] || null);
    }

    loadCQI();
  }, [programme]);

  /* =========================
   STEP 1: NORMALISE PLO DATA (OBJECT → ARRAY)
========================= */
const ploList = programmePLO
  ? Object.entries(programmePLO).map(([plo, d]) => ({
      plo,
      achieved: d.achieved ?? 0,
      assessed: d.assessed ?? 0,
      percent: d.percent ?? null,
      status: d.status || "Not Assessed",
    }))
  : [];

/* =========================
   STEP 2: BUILD CQI SUMMARY SAFELY
========================= */
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

  return (
    <div className="p-6 bg-purple-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">
        Programme CQI Dashboard
      </h1>

      {/* ===== DROPDOWN ===== */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <label className="block text-sm font-semibold mb-2">
          Select Programme
        </label>

        <select
          className="w-full border rounded px-3 py-2"
          value={programme}
          onChange={e => setProgramme(e.target.value)}
        >
          {programmes.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* ===== CQI ===== */}
      {programmePLO && (
  <>
    <ProgrammeCQISummary summary={summary} />
    <PLOAttainmentList ploData={ploList} />
  </>
)}

    </div>
  );
}
