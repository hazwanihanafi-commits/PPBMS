import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

export default function SupervisorDashboard() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("most-late");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);

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

    setLoading(false);
  }

  // SEARCH + SORT
  useEffect(() => {
    let list = students;

    if (query.trim() !== "") {
      const q = query.toLowerCase();
      list = students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          String(s.id || "").toLowerCase().includes(q)
      );
    }

    if (sort === "most-late") {
      list = [...list].sort((a, b) => b.progressPercent - a.progressPercent);
    } else if (sort === "least-late") {
      list = [...list].sort((a, b) => a.progressPercent - b.progressPercent);
    }

    setFiltered(list);
  }, [query, sort, students]);

  if (loading) return <div className="p-6">Loading students…</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-extrabold text-purple-800 mb-6">
        Supervisor Dashboard
      </h1>

      {/* SEARCH & SORT */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search student..."
          className="border rounded-xl px-4 py-2 flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="border rounded-xl px-4 py-2 w-48"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="most-late">Most Late</option>
          <option value="least-late">Least Late</option>
        </select>
      </div>

      {/* STUDENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((s, i) => (
          <div
            key={i}
            className="bg-white shadow-card border border-gray-100 rounded-2xl p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{s.name}</h2>
              <span className="text-sm font-medium text-purple-700">
                {s.progressPercent}% Progress
              </span>
            </div>

            {/* Info */}
            <div className="text-sm text-gray-700 space-y-1 mb-4">
              <p><strong>Email:</strong> {s.email}</p>
              <p><strong>Matric:</strong> {s.id}</p>
              <p><strong>Programme:</strong> {s.programme}</p>
              <p><strong>Field:</strong> {s.field}</p>
              <p><strong>Department:</strong> {s.department}</p>
              <p><strong>Start Date:</strong> {s.start_date}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-4">
              <div
                className="h-2 bg-purple-600"
                style={{ width: `${s.progressPercent}%` }}
              />
            </div>

            {/* BUTTON */}
            <button
              className="text-purple-600 font-semibold hover:underline"
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
