// frontend/pages/supervisor/index.js
import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import { useRouter } from "next/router";

export default function SupervisorDashboard() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("most-late");

  // Load students
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

  // Search + Sort
  useEffect(() => {
    let list = [...students];

    if (query.trim() !== "") {
      const q = query.toLowerCase();
      list = students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          String(s.id).toLowerCase().includes(q)
      );
    }

    if (sort === "most-late") {
      list.sort((a, b) => b.progressPercent - a.progressPercent);
    } else {
      list.sort((a, b) => a.progressPercent - b.progressPercent);
    }

    setFiltered(list);
  }, [query, sort, students]);

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-50 to-purple-100">

      {/* PAGE HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900">
          👩‍🏫 Supervisor Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Monitor research progress for all your supervisees.
        </p>
      </div>

      {/* SEARCH + SORT PANEL */}
      <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Search */}
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Search Student
            </label>
            <input
              type="text"
              placeholder="Type name, matric or email…"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-300"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Sort Progress
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-300"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="most-late">Most Late</option>
              <option value="least-late">Least Late</option>
            </select>
          </div>

        </div>
      </div>

      {/* STUDENT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filtered.map((s, index) => {
          const late = s.progressPercent < 50;

          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 hover:shadow-xl transition cursor-pointer"
              onClick={() =>
                router.push(`/supervisor/student/${encodeURIComponent(s.email)}`)
              }
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{s.name}</h2>
                  <p className="text-gray-500 text-sm">{s.email}</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    late
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {late ? "At Risk" : "On Track"}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1 text-sm text-gray-700 mb-5">
                <p><strong>Matric:</strong> {s.id}</p>
                <p><strong>Programme:</strong> {s.programme}</p>
                <p><strong>Field:</strong> {s.field}</p>
                <p><strong>Dept:</strong> {s.department}</p>
                <p><strong>Start:</strong> {s.start_date}</p>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span className="font-semibold">{s.progressPercent}%</span>
                </div>

                <div className="w-full h-3 bg-gray-200 rounded-full">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-400"
                    style={{ width: `${s.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* View Button */}
              <div className="mt-5 text-right">
                <button className="text-purple-700 font-semibold hover:underline">
                  View Full Progress →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
