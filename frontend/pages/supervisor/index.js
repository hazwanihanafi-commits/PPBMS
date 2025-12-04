import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import { useRouter } from "next/router";

export default function SupervisorDashboard() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("most-late");

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const res = await fetch(`${API_BASE}/api/supervisor/students`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const json = await res.json();
      if (json.students) {
        setStudents(json.students);
        setFiltered(json.students);
      }
    } catch (e) {
      console.error(e);
    }
  }

  /* ---------------------------
      SEARCH FILTER
  ---------------------------- */
  useEffect(() => {
    let list = students;

    if (query.trim() !== "") {
      const q = query.toLowerCase();
      list = students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          String(s.matric || "").toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sort === "most-late") {
      list = [...list].sort((a, b) => b.progressPercent - a.progressPercent);
    }
    if (sort === "least-late") {
      list = [...list].sort((a, b) => a.progressPercent - b.progressPercent);
    }

    setFiltered(list);
  }, [query, sort, students]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-purple-700 mb-6">
        Students Under My Supervision
      </h1>

      {/* SEARCH + SORT */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search student..."
          className="border rounded px-4 py-2 flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="border rounded px-4 py-2 w-48"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="most-late">Most Late</option>
          <option value="least-late">Least Late</option>
        </select>
      </div>

      {/* STUDENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((s, index) => (
          <div
            key={index}
            className="bg-white shadow rounded-xl p-6 border border-gray-200"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {s.name || "Unnamed Student"}
              </h2>

              <span
                className={`px-3 py-1 text-xs rounded-full ${
                  s.status === "Late"
                    ? "bg-red-100 text-red-600"
                    : s.status === "Completed"
                    ? "bg-green-100 text-green-600"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {s.status}
              </span>
            </div>

            {/* Info rows */}
            <div className="text-sm space-y-1 mb-4">
              <p><strong>Matric:</strong> {s.id || "-"}</p>
              <p><strong>Email:</strong> {s.email}</p>
              <p><strong>Programme:</strong> {s.programme || "-"}</p>
              <p><strong>Field:</strong> {s.field || "-"}</p>
              <p><strong>Department:</strong> {s.raw["Department"] || "-"}</p>
              <p><strong>Start Date:</strong> {s.start_date || "-"}</p>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{s.progressPercent}%</span>
              </div>

              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div
                  className="h-2 bg-purple-500 rounded-full"
                  style={{ width: `${s.progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Link */}
            <button
              className="mt-4 text-purple-600 font-medium hover:underline"
              onClick={() =>
                router.push(`/supervisor/${encodeURIComponent(s.email)}`)
              }
            >
              View Full Progress →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
