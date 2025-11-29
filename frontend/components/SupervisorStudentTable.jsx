// frontend/components/SupervisorStudentTable.js
import Link from "next/link";

export default function SupervisorStudentTable({ students = [] }) {
  if (!students || students.length === 0) {
    return <div className="p-6 text-gray-600">No students found.</div>;
  }

  return (
    <table className="w-full text-left">
      <thead>
        <tr className="bg-purple-600 text-white">
          <th className="p-3">Student</th>
          <th className="p-3">Programme</th>
          <th className="p-3">Main Supervisor</th>
          <th className="p-3">Progress</th>
          <th className="p-3">Status</th>
          <th className="p-3">View</th>
        </tr>
      </thead>
      <tbody>
        {students.map((s) => (
          <tr key={s.id} className="border-b">
            <td className="p-3">{s.name}</td>
            <td className="p-3">{s.programme}</td>
            <td className="p-3">{s.mainSupervisor || "—"}</td>
            <td className="p-3">{s.progress}%</td>
            <td className="p-3">{s.status}</td>
            <td className="p-3">
              {/* link to supervisor student detail page (you need a page at /pages/supervisor/[email].js) */}
              <Link href={`/supervisor/${encodeURIComponent(s.id)}`} legacyBehavior>
                <a className="text-purple-600 hover:underline">View</a>
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
