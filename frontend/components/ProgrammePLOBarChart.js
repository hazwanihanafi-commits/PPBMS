export default function ProgrammePLOBarChart({ data, programmePLO }) {
  const ploData = programmePLO || data || {};

  const entries = Object.entries(ploData);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        Programme-level PLO data not available yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([plo, d]) => {
        const value = Number(d.average ?? d.avg ?? 0);
        const percent = Math.min(100, Math.round((value / 5) * 100));

        return (
          <div key={plo}>
            <div className="flex justify-between text-sm font-semibold mb-1">
              <span>{plo}</span>
              <span>{value.toFixed(2)}</span>
            </div>

            <div className="w-full bg-gray-200 h-3 rounded-full">
              <div
                className={`h-3 rounded-full ${
                  value >= 3 ? "bg-green-500" : "bg-red-500"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
