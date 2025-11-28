// components/ProgressOverview.jsx

export default function ProgressOverview({ students = [] }) {
  const total = students.length;

  const avg = total
    ? Math.round(
        students.reduce((sum, s) => sum + (s.progressPct ?? 0), 0) / total
      )
    : 0;

  const overdue = students.filter((s) => s.status === "overdue").length;
  const awaiting = students.filter((s) => s.awaitingApproval).length;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-lg p-4 bg-white shadow">
        <div className="text-sm text-gray-500">Supervisees</div>
        <div className="text-2xl font-semibold">{total}</div>
      </div>

      <div className="rounded-lg p-4 bg-white shadow">
        <div className="text-sm text-gray-500">Average progress</div>
        <div className="text-2xl font-semibold">{avg}%</div>
      </div>

      <div className="rounded-lg p-4 bg-white shadow">
        <div className="text-sm text-gray-500">Overdue</div>
        <div className="text-2xl font-semibold text-red-600">{overdue}</div>
        <div className="text-sm text-gray-500">Awaiting approval: {awaiting}</div>
      </div>
    </div>
  );
}
