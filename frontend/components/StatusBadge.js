// frontend/components/StatusBadge.js
export default function StatusBadge({ status }) {
  const color =
    status === "Completed"
      ? "bg-green-100 text-green-700"
      : status === "Late"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700"; // On Track

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {status}
    </span>
  );
}
