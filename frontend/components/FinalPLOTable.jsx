export default function FinalPLOTable({ finalPLO }) {
  if (!finalPLO || Object.keys(finalPLO).length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        Final PLO attainment not available yet.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="text-lg font-bold mb-4">
        🎓 Final Programme Learning Outcome (PLO) Attainment
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-purple-100 text-purple-800">
            <tr>
              <th className="p-3 border text-left">PLO</th>
              <th className="p-3 border text-center">Average Score</th>
              <th className="p-3 border text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {Object.entries(finalPLO).map(([plo, data]) => (
              <tr key={plo} className="border-t">
                <td className="p-3 border font-semibold">
                  {plo}
                </td>

                <td className="p-3 border text-center">
                  {data.avg}
                </td>

                <td className="p-3 border text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      data.status === "Achieved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {data.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-500 italic">
        * Final PLO attainment is derived from viva examination and
        cumulative supervisory rubric assessments in accordance with MQA requirements.
      </p>
    </div>
  );
}
