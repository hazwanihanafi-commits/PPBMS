import ProgressRow from "./ProgressRow";

export default function TimelineTable({ timeline, onUpdate }) {
  return (
    <div className="mt-4 w-full overflow-x-auto bg-white shadow rounded-lg p-4">
      <h3 className="text-xl font-semibold text-purple-700 mb-4">
        Expected vs Actual Timeline
      </h3>

      <table className="min-w-full border">
        <thead>
          <tr className="bg-purple-100 text-left">
            <th className="px-3 py-2">Activity</th>
            <th className="px-3 py-2">Expected</th>
            <th className="px-3 py-2">Actual</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Remaining (days)</th>
          </tr>
        </thead>

        <tbody>
          {timeline.map((row, i) => (
            <ProgressRow key={i} row={row} onUpdate={onUpdate} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
