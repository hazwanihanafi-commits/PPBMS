export default function PLOAttainmentList({ ploData = [] }) {
  if (!Array.isArray(ploData)) {
    console.error("PLOAttainmentList expects array, got:", ploData);
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">
        📈 PLO Attainment Details
      </h2>

      {ploData.map((p) => (
        <div key={p.plo} className="mb-4">
          <div className="flex justify-between text-sm font-semibold">
            <span>{p.plo}</span>
            <span>
              {p.percent ?? "-"}% ({p.achieved}/{p.assessed})
            </span>
          </div>

          <div className="w-full bg-gray-200 h-2 rounded mt-1">
            <div
              className={`h-2 rounded ${
                p.status === "Achieved"
                  ? "bg-green-500"
                  : p.status === "Borderline"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${Math.min(p.percent ?? 0, 100)}%` }}
            />
          </div>

          {p.status !== "Achieved" && (
            <p className="text-xs text-red-600 mt-1">
              ⚠ CQI action required: strengthen supervision and rubric alignment.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
