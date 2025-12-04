// frontend/pages/supervisor/index.js
import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import { useRouter } from "next/router";

export default function SupervisorDashboard() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("mostLate");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, sortMode, students]);

  async function loadStudents() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/supervisor/students`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });
      const json = await res.json();

      if (res.ok) {
        setStudents(json.students || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function applyFilters() {
    let list = [...students];

    // SEARCH
    if (search.trim() !== "") {
      const s = search.toLowerCase();
      list = list.filter(
        (st) =>
          st.name.toLowerCase().includes(s) ||
          st.email.toLowerCase().includes(s) ||
          st.programme.toLowerCase().includes(s)
      );
    }

    // SORTING
    if (sortMode === "mostLate") {
      list.sort((a, b) => a.severity - b.severity); // 0 = At Risk, 1 = Slightly Late, 2 = On Track
    } else if (sortMode === "progressLow") {
      list.sort((a, b) => a.progressPercent - b.progressPercent);
    } else if (sortMode === "progressHigh") {
      list.sort((a, b) => b.progressPercent - a.progressPercent);
    }

    setFiltered(list);
  }

  function statusBadge(status) {
    if (status === "At Risk") {
      return (
        <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full">
          At Risk
        </span>
      );
    }
    if (status === "Slightly Late") {
      return (
        <span className="px-3 py-1 text-xs font-bold bg-yellow-100 text-yellow-700 rounded-full">
          Slightly Late
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full">
        On Track
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <h1 className="text-3xl font-extrabold text-purple-900 mb-6">
        Supervisor Dashboard
      </h1>

      {/* SEARCH + SORT */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search student…"
          className="flex-1 p-3 border rounded-xl bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="p-3 border rounded-xl bg-white"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
        >
          <option value="mostLate">Most Late (At Risk First)</option>
          <option value="progressLow">Lowest Progress</option>
          <option value="progressHigh">Highest Progress</option>
        </select>
      </div>

      {loading && <p className="text-gray-600">Loading students…</p>}

      {/* STUDENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((st) => (
          <div
            key={st.email}
            className="bg-white p-6 rounded-2xl shadow border border-gray-100"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-gray-900 uppercase">
                {st.name}
              </h2>
              {statusBadge(st.status)}
            </div>

            <p className="text-sm text-gray-700">
              <strong>Email:</strong> {st.email}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Matric:</strong> {st.id}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Programme:</strong> {st.programme}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Field:</strong> {st.field}
            </p>

            {/* PROGRESS BAR */}
            <div className="mt-4 w-full bg-gray-200 h-2 rounded-full">
              <div
                className={`h-2 rounded-full ${
                  st.status === "At Risk"
                    ? "bg-red-500"
                    : st.status === "Slightly Late"
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${st.progressPercent}%` }}
              />
            </div>

            <p className="text-right text-purple-700 font-semibold mt-1">
              {st.progressPercent}% Progress
            </p>

            <button
              onClick={() =>
                router.push(
                  `/supervisor/${encodeURIComponent(st.email)}`
                )
              }
              className="mt-4 text-purple-700 font-medium hover:underline"
            >
              View Full Progress →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
