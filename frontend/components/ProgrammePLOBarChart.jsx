export default function ProgrammePLOBarChart({ programmePLO }) {
  if (!programmePLO || Object.keys(programmePLO).length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow text-sm italic text-gray-500">
        No programme-level PLO data available.
      </div>
    );
  }

  const BENCHMARK = 70;

  // 🔑 SORT PLO NUMERICALLY (THIS IS THE FIX)
  const sortedPLO = Object.entries(programmePLO)
    .sort(([a], [b]) => {
      const na = parseInt(a.replace("PLO", ""), 10);
      const nb = parseInt(b.replace("PLO", ""), 10);
      return na - nb;
    });

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h3 className="font-bold mb-4">
        📊 Programme-level PLO Attainment
      </h3>

      <div className="space-y-4">
        {sortedPLO.map(([plo, d]) => {
          const average = Number(d.average) || 0;
          const status = average >= BENCHMARK ? "Achieved" : "At Risk";

          return (
            <div key={plo}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">{plo}</span>
                <span
                  className={`font-semibold ${
                    status === "Achieved"
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {average}% ({status})
                </span>
              </div>

              <div className="w-full bg-gray-200 h-3 rounded-full">
                <div
                  className={`h-3 rounded-full ${
                    status === "Achieved"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${average}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-gray-500 italic">
        * Programme-level PLO attainment is aggregated from final student PLO
        outcomes in accordance with MQA Continuous Quality Improvement (CQI)
        requirements.
      </p>
    </div>
  );
}
