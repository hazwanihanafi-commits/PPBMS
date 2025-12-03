import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function StudentMe() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API}/api/student/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setProfile(data.row);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load data");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-8">Loading...</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;

  const t = profile.timeline || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Student Progress</h1>

      <div className="bg-white p-4 shadow rounded mb-6">
        <h2 className="text-xl font-semibold">{profile.student_name}</h2>
        <p>Email: {profile.email}</p>
        <p>Supervisor: {profile.supervisor}</p>
        <p>Programme: {profile.programme}</p>
        <p>Start Date: {profile.start_date}</p>
      </div>

      <h3 className="text-xl font-bold mb-2">Expected vs Actual Timeline</h3>

      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="bg-purple-100">
            <th className="p-2 text-left">Activity</th>
            <th className="p-2 text-left">Expected</th>
            <th className="p-2 text-left">Actual</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Remaining</th>
          </tr>
        </thead>
        <tbody>
          {t.map((item, idx) => (
            <tr key={idx} className="border-t">
              <td className="p-2">{item.activity}</td>
              <td className="p-2">{item.expected || "-"}</td>
              <td className="p-2">{item.actual || "dd/mm/yyyy"}</td>
              <td className="p-2">{item.status}</td>
              <td className="p-2">{item.remaining_days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
