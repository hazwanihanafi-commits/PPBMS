// pages/supervisor/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import ProgressOverview from "../../components/ProgressOverview";
import SupervisorStudentTable from "../../components/SupervisorStudentTable";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SupervisorHome() {
  const [token, setToken] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState({ overdue: [], inactive: [], awaitingApproval: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) {
      setError("Not logged in");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API}/api/supervisor/my-students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        // expecting data.students = [...]
        const list = data.students || data;
        setStudents(list);

        // Derive alerts
        const overdue = list.filter(s => s.status === "overdue");
        const inactive = list.filter(s => s.daysSinceLastSubmission >= 30);
        const awaiting = list.filter(s => s.awaitingApproval);
        setAlerts({ overdue, inactive, awaitingApproval: awaiting });
      } catch (err) {
        setError(err.message || "Failed to fetch");
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
        <div>
          <h1 className="text-3xl font-bold">Supervisor dashboard</h1>
          <p className="text-gray-600">Overview of your supervisees and quick actions</p>
        </div>
        <div>
          <Link href="/supervisor/reports">
            <a className="px-4 py-2 rounded bg-purple-600 text-white hover:opacity-95">Reports</a>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg p-4 bg-white shadow">
          <div className="text-sm text-gray-500">Overdue submissions</div>
          <div className="text-2xl font-semibold text-red-600">{alerts.overdue.length}</div>
          {alerts.overdue.slice(0,3).map(s => <div key={s.id} className="text-sm">{s.student_name} — {s.nextDue}</div>)}
        </div>

        <div className="rounded-lg p-4 bg-white shadow">
          <div className="text-sm text-gray-500">Inactive (30+ days)</div>
          <div className="text-2xl font-semibold text-orange-600">{alerts.inactive.length}</div>
          {alerts.inactive.slice(0,3).map(s => <div key={s.id} className="text-sm">{s.student_name}</div>)}
        </div>

        <div className="rounded-lg p-4 bg-white shadow">
          <div className="text-sm text-gray-500">Awaiting your approval</div>
          <div className="text-2xl font-semibold text-indigo-600">{alerts.awaitingApproval.length}</div>
          {alerts.awaitingApproval.slice(0,3).map(s => <div key={s.id} className="text-sm">{s.student_name}</div>)}
        </div>
      </div>

      {/* Summary widget */}
      <ProgressOverview students={students} />

      {/* Student table */}
      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="text-lg font-semibold mb-3">Your supervisees</h2>
        <SupervisorStudentTable students={students} />
      </div>
    </div>
  );
}
