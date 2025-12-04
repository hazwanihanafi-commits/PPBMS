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
    }
    if (sort === "least-late") {
      list = [...list].sort((a, b) => a.progressPercent - b.progressPercent);
    }

    setFiltered(list);
  }, [query, sort, students]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white px-6 py-10">

      {/* HEADER */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-purple-700">
          Students Under My Supervision
        </h1>
        <p className="text-gray-600 text-lg mt-2">
          Track progress, deadlines, and milestones — all in one place.
        </p>
      </div>

      {/* SEARCH & SORT PANEL */}
      <div className="max-w-5xl mx-auto mb-10">
        <div className="bg-white shadow-md rounded-xl p-6 border border-purple-100">
          <div className="flex flex-col md:flex-row gap-4">

            {/* SEARCH BOX */}
            <input
              type="text"
              placeholder="Search student name, matric, or email..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {/* SORT SELECT */}
            <select
              className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 w-full md:w-48"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="most-late">Most Late</option>
              <option value="least-late">Least Late</option>
            </select>

          </div>
        </div>
      </div>

      {/* STUDENT CARDS */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {filtered.map((s, index) => (
          <div
            key={index}
            className="bg-white shadow-xl hover:shadow-2xl border border-purple-100 
                       rounded-2xl p-6 transition transform hover:-translate-y-1 cursor-pointer"
          >
            {/* NAME + STATUS */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{s.name}</h2>

              <span
                className={`px-3 py-1 text-xs rounded-full font-semibold ${
                  s.status === "Late"
                    ? "bg-red-100 text-red-700"
                    : s.status === "Completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {s.status}
              </span>
            </div>

            {/* BADGES */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                {s.programme}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {s.field}
              </span>
            </div>

            {/* DETAILS */}
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Matric:</strong> {s.id}</p>
              <p><strong>Email:</strong> {s.email}</p>
              <p><strong>Department:</strong> {s.raw?.["Department"] || "-"}</p>
              <p><strong>Start Date:</strong> {s.start_date}</p>
            </div>

            {/* PROGRESS BAR */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1 text-gray-600">
                <span>Progress</span>
                <span>{s.progressPercent}%</span>
              </div>

              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-purple-600 rounded-full"
                  style={{ width: `${s.progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* BUTTON */}
            <button
              onClick={() =>
                router.push(`/supervisor/${encodeURIComponent(s.email)}`)
              }
              className="mt-5 w-full bg-purple-600 hover:bg-purple-700 text-white 
                         font-semibold py-2 rounded-lg transition"
            >
              View Full Progress →
            </button>

          </div>
        ))}
      </div>

    </div>
  );
}
