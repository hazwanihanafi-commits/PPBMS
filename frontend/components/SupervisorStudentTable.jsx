// components/SupervisorStudentTable.js
import { useRouter } from "next/router";

export default function SupervisorStudentTable({ students = [] }) {
  const router = useRouter();

  if (!students || students.length === 0) {
    return (
      <div className="p-6 text-gray-500 text-center">
        No students found under your supervision.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl shadow bg-white">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-left">
            <th className="p-3">Student</th>
            <th className="p-3">Programme</th>
            <th className="p-3">Progress</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>

        <tbody>
          {students.map((s) => (
            <tr
              key={s.email}
              className="border-b hover:bg-gray-100 cursor-pointer"
              onClick={() => router.push(`/supervisor/${encodeURIComponent(s.email)}`)}
            >
              <td className="p-3 font-medium">{s.student_name}</td>
              <td className="p-3">{s.programme}</td>
              <td className="p-3">{s.progress}%</td>
              <td
                className={`p-3 font-semibold ${
                  s.category === "Ahead"
                    ? "text-green-600"
                    : s.category === "On Track"
                    ? "text-blue-600"
                    : s.category === "At Risk"
                    ? "text-orange-600"
                    : "text-red-600"
                }`}
              >
                {s.category}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
