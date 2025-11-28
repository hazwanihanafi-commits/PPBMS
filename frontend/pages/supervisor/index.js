import { useEffect, useState } from "react";
import ProgressOverview from "../../components/ProgressOverview";
import SupervisorStudentTable from "../../components/SupervisorStudentTable";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function SupervisorDashboard() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");
    if (!token) {
      setError("Not logged in");
      return;
    }

    fetch(`${API}/api/supervisor/my-students`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const txt = await res.text();
        if (!res.ok) throw new Error(txt);
        return JSON.parse(txt);
      })
      .then((data) => {
        setStudents(data.students || []);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Supervisor Dashboard</h1>

      <ProgressOverview students={students} />

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold mb-3">My Students</h2>
        <SupervisorStudentTable students={students} />
      </div>
    </div>
  );
}
