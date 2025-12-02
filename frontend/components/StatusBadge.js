export default function StatusBadge({ status }) {
  const color =
    status === "Completed"
      ? "bg-green-100 text-green-700"
      : status === "On Track"
      ? "bg-blue-100 text-blue-700"
      : "bg-red-100 text-red-700"; // Late

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {status}
    </span>
  );
}
