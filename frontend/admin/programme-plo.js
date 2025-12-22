import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import ProgrammePLOBarChart from "../../components/ProgrammePLOBarChart";

export default function ProgrammePLOPage() {
  const router = useRouter();
  const { programme } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programme) return;
    loadData();
  }, [programme]);

  async function loadData() {
    setLoading(true);
    try {
      const token = localStorage.getItem("ppbms_token");

      const res = await fetch(
        `${API_BASE}/api/admin/programme-plo?programme=${encodeURIComponent(
          programme
        )}`,
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
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading Programme PLO…</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-600">No data available</div>;
  }

  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-purple-600 hover:underline"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-purple-900">
        Programme PLO Dashboard
      </h1>

      <p className="text-gray-700">
        <strong>Programme:</strong> {programme}
      </p>

      {/* SUMMARY */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Students" value={data.summary.students} />
        <Stat label="Achieved" value={data.summary.achieved} />
        <Stat label="At Risk" value={data.summary.atRisk} />
      </div>

      {/* PLO BAR CHART */}
      <ProgrammePLOBarChart programmePLO={data.plo} />

      {/* CQI NARRATIVE */}
      {data.cqi && (
        <div className="bg-yellow-50 border p-4 rounded">
          <h3 className="font-semibold mb-2">CQI Narrative</h3>
          <p className="text-sm">{data.cqi}</p>
        </div>
      )}
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
