// components/SupervisorStudentTable.jsx
import Link from "next/link";
import { useRouter } from "next/router";

export default function SupervisorStudentTable({ students = [] }) {
  const router = useRouter();

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-purple-600 text-white">
          <th className="p-3 text-left">Student</th>
          <th className="p-3 text-left">Programme</th>
          <th className="p-3 text-left">Progress</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-left">View</th>
        </tr>
      </thead>
      <tbody>
        {students.map((s, i) => (
          <tr key={i} className="border-b hover:bg-purple-50">
            <td className="p-3">
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-gray-500">{s.id}</div>
            </td>
            <td className="p-3">{s.programme || "—"}</td>
            <td className="p-3 font-semibold">{s.progress ?? "—"}%</td>
            <td className="p-3">
              <span className={`px-2 py-1 rounded text-white font-medium
                ${s.status === "Ahead" ? "bg-green-600" : ""}
                ${s.status === "On Track" ? "bg-blue-600" : ""}
                ${s.status === "At Risk" ? "bg-yellow-500" : ""}
                ${s.status === "Behind" ? "bg-red-600" : ""}
              `}>
                {s.status}
              </span>
            </td>
            <td className="p-3">
              <Link href={`/supervisor/${encodeURIComponent(s.id)}`}>
                <a className="text-purple-700 hover:underline font-semibold">View →</a>
              </Link>
            </td>
          </tr>
        ))}
        {students.length === 0 && (
          <tr>
            <td colSpan={5} className="p-6 text-center text-gray-500">No students found.</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
