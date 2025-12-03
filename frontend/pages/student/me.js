import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function StudentPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_BASE;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState("");

  // ------------------------
  // LOAD STUDENT DATA
  // ------------------------
  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API}/api/student/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load student data");
          setLoading(false);
          return;
        }

        setProfile(data.row || null);
        setTimeline(data.row?.timeline || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("FETCH ERROR:", err);
        setError("Unable to connect to server.");
        setLoading(false);
      });
  }, []);

  // ------------------------
  // UI STATES
  // ------------------------
  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!profile) return <div className="p-8">No profile found.</div>;

  // ------------------------
  // NORMAL RENDER
  // ------------------------
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Student Progress</h1>

      {/* Student Profile */}
      <div className="bg-white shadow p-4 rounded mb-6">
        <p><strong>Name:</strong> {profile.student_name}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Programme:</strong> {profile.programme}</p>
        <p><strong>Supervisor:</strong> {profile.supervisor}</p>
        <p><strong>Start Date:</strong> {profile.start_date}</p>
      </div>

      {/* Timeline */}
      <h2 className="text-xl font-semibold mb-2">Expected vs Actual Timeline</h2>

      <div className="bg-white shadow rounded">
        <table className="w-full">
          <thead className="bg-purple-100">
            <tr>
              <th className="p-2 text-left">Activity</th>
              <th className="p-2 text-left">Expected</th>
              <th className="p-2 text-left">Actual</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Remaining (days)</th>
            </tr>
          </thead>

          <tbody>
            {timeline.map((row, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{row.activity}</td>
                <td className="p-2">{row.expected || "-"}</td>
                <td className="p-2">{row.actual || "-"}</td>
                <td className="p-2">{row.status}</td>
                <td className="p-2">{row.remaining_days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
