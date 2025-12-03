import { useEffect, useState } from "react";

export default function StudentPage() {
  const API = process.env.NEXT_PUBLIC_API_BASE || "";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStudent();
  }, []);

  const loadStudent = async () => {
    try {
      const token = localStorage.getItem("ppbms_token");
      if (!token) {
        setError("No token found. Please login again.");
        return;
      }

      const res = await fetch(`${API}/api/student/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to load student data");
        return;
      }

      setData(json.row);

    } catch (err) {
      setError("Failed to load student data");
    }
  };

  if (error) return <p className="p-4 text-red-600">{error}</p>;
  if (!data) return <p className="p-4">Loading...</p>;

  const timeline = data.timeline || [];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Student Progress</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <p><strong>Name:</strong> {data.student_name}</p>
        <p><strong>Email:</strong> {data.email}</p>
        <p><strong>Programme:</strong> {data.programme}</p>
        <p><strong>Supervisor:</strong> {data.supervisor}</p>
        <p><strong>Start Date:</strong> {data.start_date}</p>
      </div>

      <h2 className="text-lg font-bold mb-2">Expected vs Actual Timeline</h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-purple-100">
            <th className="p-2">Activity</th>
            <th className="p-2">Expected</th>
            <th className="p-2">Actual</th>
            <th className="p-2">Status</th>
            <th className="p-2">Remaining (days)</th>
          </tr>
        </thead>
        <tbody>
          {timeline.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{item.activity}</td>
              <td className="p-2">{item.expected}</td>
              <td className="p-2">{item.actual || "-"}</td>
              <td className="p-2">{item.status}</td>
              <td className="p-2">{item.remaining_days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
