import { useEffect, useState } from "react";

export default function StudentTimeline() {
  const [token, setToken] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      window.location.href = "/login";
      return;
    }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;

    fetch(`${API}/student/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setData(d.row);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div className="p-8 text-lg">Loading timeline...</div>;

  const milestones = [
    { label: "P1 Submitted", value: data.raw["P1 Submitted"] },
    { label: "P1 Approved", value: data.raw["P1 Approved"] },
    { label: "P3 Submitted", value: data.raw["P3 Submitted"] },
    { label: "P3 Approved", value: data.raw["P3 Approved"] },
    { label: "P4 Submitted", value: data.raw["P4 Submitted"] },
    { label: "P4 Approved", value: data.raw["P4 Approved"] },
    { label: "P5 Submitted", value: data.raw["P5 Submitted"] },
    { label: "P5 Approved", value: data.raw["P5 Approved"] },
  ];

  const statusBadge = (v) => {
    if (!v) return <span className="px-3 py-1 text-sm bg-gray-300 rounded-full">Pending</span>;
    return <span className="px-3 py-1 text-sm bg-green-500 text-white rounded-full">Completed</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-10 flex justify-center">
      <div className="max-w-4xl w-full bg-white shadow-2xl rounded-3xl p-10 border border-gray-200">
        <h1 className="text-4xl font-bold mb-6 text-purple-700">My Timeline</h1>

        <div className="mb-8 p-6 bg-purple-100 rounded-2xl shadow-inner">
          <h2 className="text-2xl font-bold mb-1">{data.student_name}</h2>
          <p className="text-lg text-gray-700">{data.programme}</p>
          <p className="text-gray-600 mt-2">Supervisor: <strong>{data.main_supervisor}</strong></p>
        </div>

        <h3 className="text-2xl font-semibold mb-4">Milestone Progress</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {milestones.map((m) => (
            <div key={m.label} className="p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-all">
              <p className="text-lg font-semibold">{m.label}</p>
              <p className="mt-2">{statusBadge(m.value)}</p>
              {m.value && (
                <p className="text-sm text-gray-600 mt-1">Date: {m.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center text-gray-600 italic">
          More detailed timeline charts coming soon…
        </div>
      </div>
    </div>
  );
}
