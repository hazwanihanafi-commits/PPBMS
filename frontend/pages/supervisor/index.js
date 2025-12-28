import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import TopBar from "../../components/TopBar";
import Link from "next/link";

export default function SupervisorDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("ppbms_role");
    if (role !== "supervisor") {
      router.replace("/login");
      return;
    }

    const email = localStorage.getItem("ppbms_email");
    if (email) setUser({ email, role });

    const token = localStorage.getItem("ppbms_token");

    fetch(`${API_BASE}/api/supervisor/students`, {
  method: "GET",
  cache: "no-store",               // 🔥 THIS LINE
  headers: {
    Authorization: `Bearer ${token}`,
    "Cache-Control": "no-cache"
  }
})
      .then(res => res.json())
      .then(data => {
        console.log("Supervisor students:", data);
        setStudents(data.students || []);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <>
      <TopBar user={user} />

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Supervisor Dashboard</h1>

        {students.length === 0 && (
          <p className="text-gray-500 italic">No students found.</p>
        )}

        <div className="space-y-4">
          {students.map((s, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-xl shadow flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">{s.name}</div>
                <div className="text-sm text-gray-500">{s.email}</div>
                <div className="text-xs mt-1">
                  Progress: <strong>{s.progress}%</strong> ·{" "}
                  <span
                    className={
                      s.status === "Late"
                        ? "text-red-600"
                        : s.status === "Due Soon"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }
                  >
                    {s.status}
                  </span>
                </div>
              </div>

              <Link
                href={`/supervisor/${encodeURIComponent(s.email)}`}
                className="text-purple-600 font-semibold"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
