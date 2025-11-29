// frontend/components/SupervisorStudentTable.js
import Link from "next/link";

export default function SupervisorStudentTable({ students = [] }) {
  if (!students || students.length === 0) {
    return <div className="p-6 text-gray-500">No students found.</div>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-purple-600 text-white">
          <th className="px-4 py-2 text-left">Student</th>
          <th className="px-4 py-2 text-left">Programme</th>
          <th className="px-4 py-2 text-left">Progress</th>
          <th className="px-4 py-2 text-left">Status</th>
          <th className="px-4 py-2 text-left">View</th>
        </tr>
      </thead>
      <tbody>
        {students.map((s) => (
          <tr key={s.id} className="border-b">
            <td className="px-4 py-3">{s.name}</td>
            <td className="px-4 py-3">{s.programme}</td>
            <td className="px-4 py-3">{s.progress}%</td>
            <td className="px-4 py-3">{s.status}</td>
            <td className="px-4 py-3">
              <Link href={`/supervisor/${encodeURIComponent(s.id)}`}>
                <a className="text-purple-600 hover:underline">Open</a>
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
