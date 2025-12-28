// pages/supervisor/index.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { authFetch } from "@/utils/authFetch";
import { useAuthGuard } from "@/utils/useAuthGuard";
import TopBar from "../../components/TopBar";

export default function SupervisorDashboard() {
  const router = useRouter();
  const { ready, user } = useAuthGuard("supervisor");

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

    async function load() {
      setLoading(true);
      const res = await authFetch("/api/supervisor/students");
      const json = await res.json();
      setStudents(json.students || []);
      setLoading(false);
    }

    load();
  }, [ready]);

  if (!ready) {
    return <div className="p-6 text-center">Checking access…</div>;
  }

  return (
    <>
      <TopBar user={user} />

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Supervisor Dashboard</h1>

        <input
          className="border p-2 w-full mb-4"
          placeholder="Search student…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading && <p>Loading…</p>}

        {students
          .filter(
            (s) =>
              !search ||
              s.name?.toLowerCase().includes(search.toLowerCase())
          )
          .map((s) => (
            <div key={s.email} className="border p-4 mb-3 rounded">
              <div className="font-semibold">{s.name}</div>
              <div className="text-sm">{s.email}</div>

              <button
                className="text-purple-600 mt-2"
                onClick={() =>
                  router.push(`/supervisor/${s.email.toLowerCase()}`)
                }
              >
                View Progress →
              </button>
            </div>
          ))}
      </div>
    </>
  );
}
