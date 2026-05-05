export default function FinalPLOTable({ finalPLO }) {

  if (!finalPLO || Object.keys(finalPLO).length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow text-sm text-gray-500 italic">
        No Final PLO data available yet.
      </div>
    );
  }

  const sortedFinalPLO = Object.entries(finalPLO).sort(
    ([a], [b]) => {
      const na = parseInt(a.replace("PLO", ""), 10);
      const nb = parseInt(b.replace("PLO", ""), 10);
      return na - nb;
    }
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow">

      <h3 className="font-bold mb-4 text-lg">
        🎓 Final Programme Learning Outcome (PLO) Attainment
      </h3>

      <table className="w-full text-sm">

        <thead className="bg-purple-100 text-purple-700">
          <tr>
            <th className="p-3 text-left">PLO</th>
            <th className="p-3 text-center">Final Score</th>
            <th className="p-3 text-center">Status</th>
          </tr>
        </thead>

        <tbody>

          {sortedFinalPLO.map(([plo, d]) => (

            <tr
              key={plo}
              className={`border-t ${
                d?.status === "CQI Required"
                  ? "bg-red-50"
                  : ""
              }`}
            >
              <td className="p-3 font-semibold">{plo}</td>

              {/* ✅ FIXED HERE */}
              <td className="p-3 text-center">
                {d?.value !== null && d?.value !== undefined
                  ? d.value
                  : "-"}
              </td>

              <td className="p-3 text-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    d?.status === "Achieved"
                      ? "bg-green-100 text-green-700"
                      : d?.status === "Moderate"
                      ? "bg-yellow-100 text-yellow-700"
                      : d?.status === "CQI Required"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {d?.status || "Not Assessed"}
                </span>
              </td>

            </tr>

          ))}

        </tbody>

      </table>

      <p className="mt-3 text-xs text-gray-500 italic">
        * Final PLO attainment is derived from FINAL assessment row
        (orange row) and reflects final programme-level achievement.
      </p>

    </div>
  );
}
