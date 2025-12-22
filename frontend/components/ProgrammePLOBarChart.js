export default function ProgrammePLOBarChart({ programme, data }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow mb-6">
      <div className="flex justify-between mb-4">
        <h2 className="font-bold text-purple-900">
          📊 Programme-level PLO Attainment (CQI)
        </h2>
        <span className="text-sm bg-gray-100 px-3 py-1 rounded">
          {programme}
        </span>
      </div>

      {Object.entries(data).map(([plo, d]) => (
        <div key={plo} className="mb-3">
          <div className="flex justify-between text-sm font-semibold">
            <span>{plo}</span>
            <span>
              {d.attainmentPercent}% ({d.achievedStudents}/{d.totalStudents})
            </span>
          </div>

          <div className="w-full bg-gray-200 h-2 rounded">
            <div
              className={`h-2 rounded ${
                d.status === "Achieved"
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${d.attainmentPercent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
