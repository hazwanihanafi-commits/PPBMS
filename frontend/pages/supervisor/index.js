import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SupervisorPage() {
  const [token, setToken] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("late");

  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (t) setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;

    (async () => {
      const res = await fetch(`${API}/api/supervisor/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStudents(data.students || []);
    })();
  }, [token]);

  // --- Search Filter ---
  const filtered = students.filter((s) =>
    `${s.student_name} ${s.email} ${s.field} ${s.department}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // --- Sorting ---
  filtered.sort((a, b) => {
    if (sort === "late") return a.progress_percent - b.progress_percent; // lowest progress → top
    if (sort === "progress") return b.progress_percent - a.progress_percent; // highest first
    if (sort === "az") return a.student_name.localeCompare(b.student_name);
    return 0;
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold text-purple-700">
        Students Under My Supervision
      </h1>

      {/* Search + Sort Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <input
          type="text"
          placeholder="Search student..."
          className="px-4 py-2 border rounded-lg w-full md:w-72"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="px-4 py-2 border rounded-lg w-full md:w-48"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="late">Most Late</option>
          <option value="progress">Most Progress</option>
          <option value="az">A–Z</option>
        </select>
      </div>

      {/* Student Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {filtered.map((s, idx) => (
          <StudentCard key={idx} s={s} />
        ))}
      </div>
    </div>
  );
}

/* ======================================================
   STUDENT CARD COMPONENT (Improved 2025 UI)
====================================================== */

function StudentCard({ s }) {
  const initials = (s.student_name || "")
    .split(" ")
    .map((v) => v[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Status color
  const statusColor =
    s.progress_percent === 100
      ? "bg-green-100 text-green-700"
      : s.progress_percent > 40
      ? "bg-blue-100 text-blue-700"
      : "bg-red-100 text-red-700";

  // Side border color
  const borderColor =
    s.progress_percent === 100
      ? "border-green-400"
      : s.progress_percent > 40
      ? "border-blue-400"
      : "border-red-400";

  return (
    <div
      className={`rounded-2xl border-l-8 ${borderColor} bg-white shadow-md p-6 flex flex-col gap-5`}
    >
      {/* Top Row: Name + Status */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold">{s.student_name}</h2>
          <p className="text-gray-600 text-sm">{s.programme}</p>

          {/* Tags */}
          <div className="flex gap-2 mt-2 text-xs flex-wrap">
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
              {s.field || "-"}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
              {s.department || "-"}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}
        >
          {s.progress_percent === 100
            ? "Completed"
            : s.progress_percent > 40
            ? "On Track"
            : "Late"}
        </span>
      </div>

      {/* Avatar + Info */}
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center font-bold text-lg">
          {initials}
        </div>

        <div className="text-sm space-y-1">
          <p>
            <strong>Email:</strong> {s.email}
          </p>
          <p>
            <strong>Start Date:</strong> {s.start_date}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>
            {s.completed} / {s.total} completed
          </span>
          <span className="font-semibold text-gray-900">
            {s.progress_percent}%
          </span>
        </div>

        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full"
            style={{ width: `${s.progress_percent}%` }}
          />
        </div>
      </div>

      {/* View Details Button */}
      <div className="text-right">
        <a
          href={`/student/${s.email}`}
          className="text-purple-700 text-sm font-semibold hover:underline"
        >
          View Full Progress →
        </a>
      </div>
    </div>
  );
}
