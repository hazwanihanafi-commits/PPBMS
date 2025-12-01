export default function ProgressRow({ row, onUpdate }) {
  // Status colours
  const color =
    row.status === "Completed"
      ? "text-green-600"
      : row.status === "Late"
      ? "text-red-600"
      : "text-yellow-600";

  return (
    <tr className="border-b hover:bg-gray-50">
      {/* Activity */}
      <td className="p-2 font-medium text-gray-700">{row.activity}</td>

      {/* Expected */}
      <td className="p-2 text-gray-600">{row.expected}</td>

      {/* Actual - student selects date */}
      <td className="p-2">
        <input
          type="date"
          value={row.actual || ""}
          onChange={(e) => onUpdate(row.activity, e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
      </td>

      {/* Status with colour */}
      <td className={`p-2 font-semibold ${color}`}>{row.status}</td>

      {/* Remaining */}
      <td className="p-2 text-gray-600">{row.remaining}</td>
    </tr>
  );
}
