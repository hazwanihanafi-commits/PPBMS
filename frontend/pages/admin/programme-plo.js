import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import ProgrammePLOBarChart from "../../components/ProgrammePLOBarChart";

export default function ProgrammePLOPage() {
  const router = useRouter();
  const { programme: programmeQuery } = router.query;

  const [programme, setProgramme] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     SYNC PROGRAMME FROM URL
  ========================== */
  useEffect(() => {
    if (!programmeQuery) return;

    // decode URL value properly
    const decoded = decodeURIComponent(programmeQuery);
    setProgramme(decoded);
  }, [programmeQuery]);

  /* =========================
     FETCH PROGRAMME PLO
  ========================== */
  useEffect(() => {
    if (!programme) return;

    loadProgrammePLO();
  }, [programme]);

  async function loadProgrammePLO() {
    try {
      setLoading(true);
      const token = localStorage.getItem("ppbms_token");

      const res = await fetch(
        `${API_BASE}/api/admin/programme-plo?programme=${encodeURIComponent(
          programme
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Programme PLO load error:", e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     HANDLE DROPDOWN CHANGE
  ========================== */
  function handleProgrammeChange(value) {
    setProgramme(value);

    router.push(
      `/admin/programme-plo?programme=${encodeURIComponent(value)}`,
      undefined,
      { shallow: true }
    );
  }

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <h1 className="text-2xl font-bold text-purple-700 mb-6">
        Programme PLO Dashboard
      </h1>

      {/* PROGRAMME SELECT */}
      <select
        value={programme}
        onChange={(e) => handleProgrammeChange(e.target.value)}
        className="border rounded px-3 py-2 mb-6"
      >
        <option value="Doctor of Philosophy">PhD</option>
        <option value="Master of Science">MSc</option>
      </select>

      {/* CONTENT */}
      {loading ? (
        <p>Loading programme PLO…</p>
      ) : data?.plo ? (
        <>
          <ProgrammePLOBarChart programmePLO={data.plo} />

          <div className="mt-6 bg-yellow-50 border rounded p-4">
            <h3 className="font-semibold mb-2">CQI Narrative</h3>
            <p className="text-sm">{data.cqi || "CQI will be generated once data is available."}</p>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow text-gray-500 italic">
          No programme-level PLO data available.
        </div>
      )}
    </div>
  );
}
