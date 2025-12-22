import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import ProgrammePLOBarChart from "../../components/ProgrammePLOBarChart";

export default function ProgrammePLOPage() {
  const [programme, setProgramme] = useState("PhD");
  const [cohort, setCohort] = useState("");
  const [status, setStatus] = useState("Active");
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, [programme, cohort, status]);

  async function loadData() {
    const token = localStorage.getItem("ppbms_token");

    const params = new URLSearchParams({
      programme,
      status,
      ...(cohort && { cohort })
    });

    const res = await fetch(
      `${API_BASE}/api/admin/programme-plo?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const json = await res.json();
    setData(json);
  }

  if (!data) return <p className="p-6">Loading Programme PLO…</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-purple-700">
        Programme PLO Dashboard
      </h1>

      {/* Filters */}
      <div className="flex gap-4">
        <select value={programme} onChange={e => setProgramme(e.target.value)}>
          <option value="PhD">PhD</option>
          <option value="MSc">MSc</option>
        </select>

        <input
          placeholder="Cohort (e.g. 2023)"
          value={cohort}
          onChange={e => setCohort(e.target.value)}
        />

        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="Active">Active</option>
          <option value="Graduated">Graduated</option>
          <option value="">All</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Students" value={data.summary.students} />
        <Stat label="Avg Overall PLO" value={`${data.summary.avgOverall}%`} />
        <Stat label="Achieved" value={data.summary.achieved} />
        <Stat label="At Risk" value={data.summary.atRisk} />
      </div>

      {/* Chart */}
      <ProgrammePLOBarChart data={data.plo} />

      {/* CQI */}
      <div className="bg-yellow-50 border p-4 rounded">
        <h3 className="font-semibold mb-2">CQI Narrative</h3>
        <p>{data.cqi}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
