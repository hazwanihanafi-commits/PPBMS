// frontend/pages/supervisor/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import SupervisorStudentTable from "../../components/SupervisorStudentTable";
import ProgressCard from "../../components/ProgressCard";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function SupervisorIndex() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ----------------------------
  //  LOAD SUPERVISOR'S STUDENTS
  // ----------------------------
  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");
    const supervisorEmail =
      localStorage.getItem("ppbms_user_email") || router.query.email;

    if (!token || !supervisorEmail) {
      setLoading(false);
      return;
    }

    fetch(
      `${API}/api/supervisor/students?email=${encodeURIComponent(
        supervisorEmail
      )}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then(async (r) => {
        const txt = await r.text();
        if (!r.ok) throw new Error(txt);
        return JSON.parse(txt);
      })
      .then((data) => {
        const list = data.students || [];
        setStudents(list);
        setFiltered(list);
      })
      .catch((err) => console.error("Supervisor fetch error:", err))
      .finally(() => setLoading(false));
  }, [router.query.email]);

  // ----------------------------
  //  SEARCH FILTER
  // ----------------------------
  useEffect(() => {
    if (!search.trim()) return setFiltered(students);
    const q = search.toLowerCase();

    setFiltered(
      students.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(q) ||
          (s.id || "").toLowerCase().includes(q)
      )
    );
  }, [search, students]);

  // ----------------------------
  //  METRICS (CARDS)
  // ----------------------------
  const counts = {
    ahead: students.filter((s) => s.status === "Ahead" || s.progress === 100)
      .length,
    onTrack: students.filter((s) => s.status === "On Track").length,
    atRisk: students.filter((s) => s.status === "At Risk").length,
    behind: students.filter((s) => s.status === "Behind").length,
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* HEADER CARD */}
      <header className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow">
        <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
        <p className="mt-1 text-sm">Overview of your supervisees</p>
      </header>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ProgressCard title="Ahead / Completed" value={counts.ahead} />
        <ProgressCard title="On Track" value={counts.onTrack} />
        <ProgressCard title="At Risk" value={counts.atRisk} />
        <ProgressCard title="Behind" value={counts.behind} />
      </div>

      {/* SEARCH BAR + ANALYTICS BUTTON */}
      <div className="flex gap-4 items-center">
        <input
          className="flex-1 p-3 rounded border"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Link href="/supervisor/analytics" legacyBehavior>
          <a className="px-4 py-2 rounded bg-purple-600 text-white">
            Analytics
          </a>
        </Link>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow p-4">
        {loading ? (
          <div className="p-6">Loading…</div>
        ) : (
          <SupervisorStudentTable students={filtered} />
        )}
      </div>
    </div>
  );
}
