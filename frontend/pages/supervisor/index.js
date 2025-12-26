import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { authFetch } from "@/utils/authFetch";

export default function SupervisorDashboard() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [roleChecked, setRoleChecked] = useState(false);

  // 🔐 ROLE GUARD (BLOCK EARLY)
  useEffect(() => {
    const role = localStorage.getItem("ppbms_role");
    if (role !== "supervisor") {
      window.location.href = "/login";
      return;
    }
    setRoleChecked(true);
  }, []);

  // ⛔ Stop here until role is validated
  useEffect(() => {
    if (!roleChecked) return;
    loadStudents();
  }, [roleChecked]);

  useEffect(() => {
    applyFilters();
  }, [search, students]);

  async function loadStudents() {
    setLoading(true);
    try {
      const res = await authFetch("/api/supervisor/students");
      const json = await res.json();
      setStudents(json.students || []);
    } catch (e) {
      console.error("Load students error:", e);
      setStudents([]);
    }
    setLoading(false);
  }

  function applyFilters() {
    let list = [...students];
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (st) =>
          st.name?.toLowerCase().includes(s) ||
          st.email?.toLowerCase().includes(s) ||
          st.programme?.toLowerCase().includes(s)
      );
    }
    setFiltered(list);
  }

  if (!roleChecked) {
    return <div className="p-6 text-center">Checking access…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <h1 className="text-3xl font-extrabold text-purple-900 mb-6">
        Supervisor Dashboard
      </h1>

      {/* SEARCH */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search student…"
          className="flex-1 p-3 border rounded-xl bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="text-gray-600">Loading students…</p>}

      {/* STUDENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((st) => (
          <div
            key={st.email}
            className="bg-white p-6 rounded-2xl shadow border border-gray-100"
          >
            <h2 className="text-lg font-bold text-gray-900 uppercase mb-2">
              {st.name}
            </h2>

            <p className="text-sm text-gray-700">
              <strong>Email:</strong> {st.email}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Matric:</strong> {st.id || "-"}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Programme:</strong> {st.programme || "-"}
            </p>

            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-800">
                Overall Progress
              </p>
              <p className="text-2xl font-extrabold text-purple-700">
                {st.progressPercent}%
              </p>
            </div>

            <button
              onClick={() =>
                router.push({
                  pathname: "/supervisor/[email]",
                  query: { email: st.email.trim().toLowerCase() },
                })
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
