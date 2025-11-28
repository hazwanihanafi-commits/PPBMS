// pages/admin/index.js
import { useEffect, useState } from "react";
import AdminAnalytics from "../../components/AdminAnalytics";
import SupervisorStudentTable from "../../components/SupervisorStudentTable";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function AdminHome() {
  const [token, setToken] = useState(null);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { setToken(localStorage.getItem("ppbms_token")); }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Not logged in");
      return;
    }
    (async () => {
      try {
        const [sRes, aRes] = await Promise.all([
          fetch(`${API}/api/admin/all-students`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!sRes.ok) throw new Error(await sRes.text());
        if (!aRes.ok) throw new Error(await aRes.text());
        const sData = await sRes.json();
        const aData = await aRes.json();
        setStudents(sData.students || sData);
        setAnalytics(aData);
      } catch (err) {
        setError(err.message || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin dashboard</h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5">
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="font-semibold text-lg mb-3">Analytics</h3>
            <AdminAnalytics analytics={analytics} />
          </div>
        </div>

        <div className="col-span-7">
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="font-semibold text-lg mb-3">All students</h3>
            <SupervisorStudentTable students={students} showSupervisorColumn showActionsForAdmin />
          </div>
        </div>
      </div>
    </div>
  );
}
