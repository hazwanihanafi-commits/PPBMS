import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import ProgrammePLOBarChart from "../../components/ProgrammePLOBarChart";

export default function ProgrammePLOPage() {
  const [programme, setProgramme] = useState("Doctor of Philosophy");
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, [programme]);

  async function loadData() {
    const token = localStorage.getItem("ppbms_token");

    const res = await fetch(
      `${API_BASE}/api/admin/programme-plo?programme=${encodeURIComponent(programme)}`,
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

      <select
        value={programme}
        onChange={(e) => setProgramme(e.target.value)}
        className="border px-3 py-2 rounded"
      >
        <option value="Doctor of Philosophy">PhD</option>
        <option value="Master of Science">MSc</option>
      </select>

      <ProgrammePLOBarChart programmePLO={data.plo} />

      <div className="bg-yellow-50 border p-4 rounded">
        <h3 className="font-semibold mb-2">CQI Narrative</h3>
        <p>{data.cqi}</p>
      </div>
    </div>
  );
}
