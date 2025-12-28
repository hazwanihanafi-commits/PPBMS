import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";
import TopBar from "../../components/TopBar";

/* ======================
   STATUS BADGE
====================== */
function StatusBadge({ status }) {
  const map = {
    Late: "bg-red-100 text-red-700",
    "Due Soon": "bg-yellow-100 text-yellow-700",
    "On Track": "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        map[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}

/* ======================
   STUDENT PROFILE CARD
====================== */
function StudentCard({ s, onView }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow space-y-3">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{s.name}</h3>

            {/* ⚠️ CQI WARNING */}
            {s.hasCQI && (
              <span
                title="CQI Required"
                className="text-red-600 text-lg"
              >
                ⚠️
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600">{s.email}</p>
        </div>

        <StatusBadge status={s.status} />
      </div>

      {/* DETAILS */}
      <div className="text-sm text-gray-700 space-y-1">
        <div>
          <strong>Programme:</strong>{" "}
          {s.programme || "-"}
        </div>

        <div>
          <strong>Supervisor:</strong>{" "}
          {s.supervisor || "-"}
        </div>

        <div>
          <strong>Co-Supervisor(s):</strong>{" "}
          {s.cosupervisors || "None"}
        </div>
      </div>

      {/* PROGRESS */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span>Progress</span>
          <span className="font-semibold">
            {s.progress ?? 0}%
          </span>
        </div>

        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div
            className="bg-purple-600 h-2 rounded-full"
            style={{ width: `${s.progress ?? 0}%` }}
          />
        </div>
      </div>

      {/* ACTION */}
      <div className="pt-2 text-right">
        <button
          onClick={onView}
          className="text-purple-600 font-semibold hover:underline"
        >
          View Progress →
        </button>
      </div>
    </div>
  );
}

/* ======================
   PAGE
====================== */
export default function SupervisorDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("ppbms_role");
    const email = localStorage.getItem("ppbms_email");

    if (role !== "supervisor") {
      router.replace("/login");
      return;
    }

    setUser({ email, role });
    loadStudents();
  }, []);

  async function loadStudents() {
    const token = localStorage.getItem("ppbms_token");

    const res = await fetch(`${API_BASE}/api/supervisor/students`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setStudents(data.students || []);
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TopBar user={user} />

      <div className="min-h-screen bg-purple-50 p-6">
        <h1 className="text-2xl font-bold mb-4">
          Supervisor Dashboard
        </h1>

        {/* SEARCH */}
        <input
          className="w-full border p-3 rounded mb-6"
          placeholder="Search student…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* STUDENT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(s => (
            <StudentCard
              key={s.email}
              s={s}
              onView={() =>
                router.push(
                  `/supervisor/${encodeURIComponent(s.email)}`
                )
              }
            />
          ))}
        </div>
      </div>
    </>
  );
}
