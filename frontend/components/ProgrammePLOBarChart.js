// components/ProgrammePLOBarChart.js
export default function ProgrammePLOBarChart({ plo }) {
  if (!plo || plo.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow text-sm italic text-gray-500">
        No programme-level PLO data available.
      </div>
    );
  }

  const BENCHMARK = 70;

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h3 className="font-bold mb-4">
        📊 Programme-level PLO Attainment
      </h3>

      <div className="space-y-4">
        {plo.map(({ plo, average }) => {
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
