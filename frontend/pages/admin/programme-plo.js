import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import ProgrammePLOBarChart from "../../components/ProgrammePLOBarChart";

export default function ProgrammePLOPage() {
  const [programme, setProgramme] = useState("phd");
  const [data, setData] = useState(null);

  useEffect(() => {
    load();
  }, [programme]);

  async function load() {
    const token = localStorage.getItem("ppbms_token");

    const res = await fetch(
      `${API_BASE}/api/admin/programme-plo?programme=${programme}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const json = await res.json();
    setData(json);
  }

  if (!data) return <p className="p-6">Loading…</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-purple-700">
        Programme PLO Dashboard
      </h1>

      <select
  value={programme}
  onChange={(e) => setProgramme(e.target.value)}
  className="border px-3 py-1 rounded"
>
  <option value="phd">PhD</option>
  <option value="msc">MSc</option>
</select>


      <ProgrammePLOBarChart programmePLO={data.plo} />

      <div className="bg-yellow-50 p-4 rounded">
        <h3 className="font-semibold mb-2">CQI Narrative</h3>
        <p>{data.cqi || "CQI will be generated once data is available."}</p>
      </div>
    </div>
  );
}
