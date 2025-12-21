import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import { useRouter } from "next/router";

export default function AdminDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch(`${API_BASE}/api/admin/all-students`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
      },
    });
    const json = await res.json();
    setStudents(json.students || []);
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="space-y-4">
        {students.map(st => (
          <div
            key={st.email}
            className="bg-white p-4 rounded-xl shadow flex justify-between"
          >
            <div>
              <p className="font-bold">{st["Student Name"]}</p>
              <p className="text-sm">{st["Student's Email"]}</p>
            </div>

            {/* ✅ CORRECT LINK */}
            <button
              onClick={() =>
                router.push(`/supervisor/${encodeURIComponent(st["Student's Email"])}`)
              }
              className="text-purple-700 underline text-sm"
            >
              View Student (CQI)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
