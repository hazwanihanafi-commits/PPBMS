import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import ProgrammePLOBarChart from "../../components/ProgrammePLOBarChart";

export default function ProgrammePLOPage() {
  const [programme, setProgramme] = useState("Doctor of Philosophy");
  const [cohort, setCohort] = useState("");
  const [status, setStatus] = useState("Active");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [programme, cohort, status]);

  async function loadData() {
    try {
      setLoading(true);
      const token = localStorage.getItem("ppbms_token");

      const params = new URLSearchParams({
        programme,
        ...(status && { status }),
        ...(cohort && { cohort }),
      });

      const res = await fetch(
        `${API_BASE}/api/admin/programme-plo?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  if (loading) {
    return <p className="p-6">Loading Programme PLO…</p>;
  }

  if (!data) {
    return <p className="p-6 text-red-600">Failed to load Programme PLO.</p>;
  }

  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-6">
      <h1 className="text-2xl font-bold text-purple-800">
        Programme PLO Dashboard
      </h1>

      {/* =========================
          FILTERS
      ========================== */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow">
        <select
          value={programme}
          onChange={(e) => setProgramme(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="Doctor of Philosophy">
            Doctor of Philosophy (PhD)
          </option>
          <option value="Master of Science">
            Master of Science (MSc)
          </option>
        </select>

        <input
          placeholder="Cohort (e.g. 2023)"
          value={cohort}
          onChange={(e) => setCohort(e.target.value)}
          className="border rounded px-3 py-2"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="Active">Active</option>
          <option value="Graduated">Graduated</option>
          <option value="">All Status</option>
        </select>
      </div>

      {/* =========================
          SUMMARY
      ========================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Students" value={data.summary.students} />
        <Stat
          label="Average Overall PLO"
          value={`${data.summary.avgOverall}%`}
        />
        <Stat label="Achieved PLOs" value={data.summary.achieved} />
        <Stat label="At Risk PLOs" value={data.summary.atRisk} />
      </div>

      {/* =========================
          PROGRAMME PLO BAR CHART
      ========================== */}
      <ProgrammePLOBarChart programmePLO={data.plo} />

      {/* =========================
          CQI NARRATIVE
      ========================== */}
      {data.cqi && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
          <h3 className="font-semibold mb-2">
            Continuous Quality Improvement (CQI)
          </h3>
          <p className="text-sm text-gray-700">{data.cqi}</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-purple-800"
