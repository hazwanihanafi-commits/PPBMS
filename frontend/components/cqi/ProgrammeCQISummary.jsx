export default function ProgrammeCQISummary({ summary }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow mb-6">
      <h2 className="text-lg font-bold mb-4">
        Programme CQI Summary
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-red-50 p-4 rounded-xl">
          <div className="font-semibold text-red-700">CQI Required</div>
          <div className="text-2xl font-bold">{summary.red}</div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-xl">
          <div className="font-semibold text-yellow-700">Borderline</div>
          <div className="text-2xl font-bold">{summary.yellow}</div>
        </div>

        <div className="bg-green-50 p-4 rounded-xl">
          <div className="font-semibold text-green-700">Achieved</div>
          <div className="text-2xl font-bold">{summary.green}</div>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl">
          <div className="font-semibold text-purple-700">Overall Risk</div>
          <div className="text-lg font-bold">{summary.risk}</div>
        </div>
      </div>
    </div>
  );
}
