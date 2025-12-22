export default function ProgrammePLOBarChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <p className="text-sm italic text-gray-500">
        No programme-level PLO data available.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([plo, d]) => {
        const width = Math.min((d.average / 5) * 100, 100);

        return (
          <div key={plo}>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>{plo}</span>
              <span>{d.average}</span>
            </div>

            <div className="w-full bg-gray-200 h-3 rounded-full">
              <div
                className={`h-3 rounded-full ${
                  d.status === "Achieved"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
