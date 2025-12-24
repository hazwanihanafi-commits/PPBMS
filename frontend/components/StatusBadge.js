export default function StatusBadge({ status, isLate }) {
  if (status === "Completed") {
    return (
      <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
        Completed
      </span>
    );
  }

  if (isLate) {
    return (
      <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700">
        Delayed
      </span>
    );
  }

  return (
    <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
      Pending
    </span>
  );
}
