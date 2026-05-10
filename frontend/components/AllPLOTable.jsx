export default function AllPLOTable({ allPLO }) {

  if (!allPLO || Object.keys(allPLO).length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow text-sm text-gray-500 italic">
        No PLO assessment data available yet.
      </div>
    );
  }

  // collect all unique PLOs
  const ploSet = new Set();

  Object.values(allPLO).forEach((assessment) => {

    Object.keys(assessment || {}).forEach((plo) => {
      ploSet.add(plo);
    });

  });

  const ploColumns = Array.from(ploSet).sort((a, b) => {

    const na = parseInt(a.replace("PLO", ""), 10);
    const nb = parseInt(b.replace("PLO", ""), 10);

    return na - nb;

  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow overflow-x-auto">

      <h3 className="font-bold mb-4 text-lg">
        📊 PLO Attainment Across All Assessments
      </h3>

      <table className="min-w-full text-sm border">

        <thead className="bg-indigo-100 text-indigo-700">

          <tr>

            <th className="p-3 text-left border">
              Assessment
            </th>

            {ploColumns.map((plo) => (

              <th
                key={plo}
                className="p-3 text-center border"
              >
                {plo}
              </th>

            ))}

          </tr>

        </thead>

        <tbody>

          {Object.entries(allPLO).map(
            ([assessment, values]) => (

              <tr
                key={assessment}
                className="border-t hover:bg-gray-50"
              >

                <td className="p-3 border font-medium capitalize">
                  {assessment
                    .replaceAll("_", " ")
                    .replace(/\b\w/g, l => l.toUpperCase())}
                </td>

                {ploColumns.map((plo) => {

                  const item = values?.[plo];

                  return (
                    <td
                      key={plo}
                      className="p-3 border text-center"
                    >

                      {item?.value !== null &&
                      item?.value !== undefined ? (

                        <div>

                          <div className="font-semibold">
                            {item.value}
                          </div>

                          <div
                            className={`text-[10px] mt-1 rounded-full px-2 py-0.5 inline-block ${
                              item.status === "Achieved"
                                ? "bg-green-100 text-green-700"
                                : item.status === "Moderate"
                                ? "bg-yellow-100 text-yellow-700"
                                : item.status === "CQI Required"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {item.status || "N/A"}
                          </div>

                        </div>

                      ) : (
                        "-"
                      )}

                    </td>
                  );

                })}

              </tr>

            )
          )}

        </tbody>

      </table>

      <p className="mt-3 text-xs text-gray-500 italic">
        * This table shows PLO attainment for every assessment instance,
        not only final attainment.
      </p>

    </div>
  );
}
