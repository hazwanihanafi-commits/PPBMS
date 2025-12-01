// frontend/components/SupervisorStudentTable.jsx
import Link from "next/link";

export default function SupervisorStudentTable({ students = [] }) {
  return (
    <table className="min-w-full">
      <thead>
        <tr>
          <th className="p-2">Name</th>
          <th className="p-2">Programme</th>
          <th className="p-2">Progress</th>
          <th className="p-2">Status</th>
          <th className="p-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {students.map(s => (
          <tr key={s.id} className="border-t">
            <td className="p-2">{s.name}</td>
            <td className="p-2">{s.programme || "-"}</td>
            <td className="p-2">{s.progress}%</td>
            <td className="p-2">{s.status}</td>
            <td className="p-2">
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
