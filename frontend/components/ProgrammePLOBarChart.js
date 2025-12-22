export default function ProgrammePLOBarChart({ data }) {
  if (!data) return null;

  // Ensure ordered PLO1 → PLO11
  const ordered = Array.from({ length: 11 }, (_, i) => {
    const key = `PLO${i + 1}`;
    return {
      plo: key,
      value: Number(data[key] ?? 0),
    };
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow mb-8">
      <h2 className="text-lg font-bold mb-4">
        📊 Programme-level PLO Attainment (CQI)
      </h2>

      <div className="space-y-3">
        {ordered.map(({ plo, value }) => {
          const percent = Math.min((value / 5) * 100, 100);
          const color =
            value >= 3 ? "bg-green-500" : "bg-red-500";

          return (
            <div key={plo}>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span>{plo}</span>
                <span>{value.toFixed(2)}</span>
              </div>

              <div className="w-full bg-gray-200 h-3 rounded-full">
                <div
                  className={`h-3 rounded-full ${color}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        * Average derived from final PLO attainment of all students
      </p>
    </div>
  );
}
