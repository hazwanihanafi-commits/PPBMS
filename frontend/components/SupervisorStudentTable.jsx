// components/SupervisorStudentTable.jsx

import Link from "next/link";

export default function SupervisorStudentTable({
  students = [],
  showSupervisorColumn = false,
  showActionsForAdmin = false,
}) {
  if (!students || students.length === 0)
    return <div className="text-sm text-gray-500">No students found.</div>;

  return (
    <table className="w-full table-auto">
      <thead>
        <tr className="text-left">
          <th className="p-2">Name</th>
          <th className="p-2">Programme</th>
          {showSupervisorColumn && <th className="p-2">Supervisor</th>}
          <th className="p-2">Progress</th>
          <th className="p-2">Last Submission</th>
          <th className="p-2">Next Due</th>
          <th className="p-2">Status</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>

      <tbody>
        {students.map((s) => (
          <tr key={s.id || s.email} className="border-b">
            {/* Name */}
            <td className="p-2">
              <div className="font-semibold">{s.student_name}</div>
              <div className="text-xs text-gray-500">{s.email}</div>
            </td>

            <td className="p-2">{s.programme}</td>

            {showSupervisorColumn && <td className="p-2">{s.supervisor}</td>}

            {/* Progress */}
            <td className="p-2">
              <span className="font-semibold">
                {s.progressPct ?? s.progress ?? "—"}%
              </span>
            </td>

            {/* Last Submission */}
            <td className="p-2">{s.lastSubmission ?? "—"}</td>

            {/* Next Due */}
            <td className="p-2">{s.nextDue ?? "—"}</td>

            {/* Status */}
            <td className="p-2">
              {s.status === "overdue" ? (
                <span className="text-red-600">Overdue</span>
              ) : s.status === "warning" ? (
                <span className="text-orange-600">Warning</span>
              ) : (
                <span className="text-green-600">OK</span>
              )}
            </td>

            {/* Actions */}
            <td className="p-2">
              <div className="flex gap-2">
                <Link href={`/supervisor/${s.id || s.email}`}>
                  <a className="text-purple-600 hover:underline">Open</a>
                </Link>

                {showActionsForAdmin && (
                  <a className="text-indigo-600 hover:underline">Edit</a>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
