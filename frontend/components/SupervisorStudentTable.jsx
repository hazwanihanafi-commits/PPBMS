// frontend/components/SupervisorStudentTable.js
import Link from "next/link";

export default function SupervisorStudentTable({ students = [] }) {
  if (!students || students.length === 0) {
    return <div className="p-6 text-gray-600">No students found.</div>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-purple-600 text-white">
          <th className="p-3 text-left">Student</th>
          <th className="p-3 text-left">Programme</th>
          <th className="p-3 text-left">Supervisor</th>
          <th className="p-3 text-left">Progress</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-left">View</th>
        </tr>
      </thead>
      <tbody>
        {students.map((s) => (
          <tr key={s.id} className="border-b">
            <td className="p-3">{s.name}</td>
            <td className="p-3">{s.programme}</td>
            <td className="p-3">{s.supervisor}</td>
            <td className="p-3">{s.progress}%</td>
            <td className="p-3">{s.status}</td>
            <td className="p-3">
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
