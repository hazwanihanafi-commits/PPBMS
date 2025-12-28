import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { authFetch } from "@/utils/authFetch";
import TopBar from "../../components/TopBar";

export default function SupervisorDashboard() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [accessChecked, setAccessChecked] = useState(false);
  const [user, setUser] = useState(null);

  /* =====================================================
     AUTH GUARD — SINGLE SOURCE OF TRUTH (NO BLINK)
  ===================================================== */
  useEffect(() => {
    if (!router.isReady) return;

    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");
    const email = localStorage.getItem("ppbms_email");

    if (!token || role !== "supervisor") {
      router.replace("/login");
      return;
    }

    setUser({ email, role });
    setAccessChecked(true);
  }, [router.isReady]);

  /* =====================================================
     LOAD STUDENTS (ONLY AFTER ACCESS CONFIRMED)
  ===================================================== */
  useEffect(() => {
    if (!accessChecked) return;
    loadStudents();
  }, [accessChecked]);

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

  /* =====================================================
     DERIVED FILTER (NO STATE LOOP)
  ===================================================== */
  const filtered = students.filter((st) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      st.name?.toLowerCase().includes(s) ||
      st.email?.toLowerCase().includes(s) ||
      st.programme?.toLowerCase().includes(s)
    );
  });

  /* =====================================================
     SUMMARY
  ===================================================== */
  const summary = {
    graduated: students.filter((s) => s.status === "Graduated").length,
    risk: students.filter(
      (s) => s.status !== "Graduated" && s.progressPercent < 50
    ).length,
    dueSoon: students.filter(
      (s) =>
        s.status !== "Graduated" &&
        s.progressPercent >= 50 &&
        s.progressPercent < 80
    ).length,
    onTime: students.filter(
      (s) => s.status !== "Graduated" && s.progressPercent >= 80
    ).length,
  };

  function getStudentStatus(st) {
    if (st.status === "Graduated") {
      return { label: "Graduated", color: "bg-green-100 text-green-700" };
    }
    if (st.progressPercent < 50) {
      return { label: "At Risk", color: "bg-red-100 text-red-700" };
    }
    if (st.progressPercent < 80) {
      return { label: "Due Soon", color: "bg-yellow-100 text-yellow-700" };
    }
    return { label: "On Time", color: "bg-blue-100 text-blue-700" };
  }

  /* =====================================================
     HARD STOP — NOTHING RENDERS BEFORE AUTH
  ===================================================== */
  if (!accessChecked) {
    return <div className="p-6 text-center">Checking access…</div>;
  }

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <>
      <TopBar user={user} />

      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
        <h1 className="text-3xl font-extrabold text-purple-900 mb-6">
          Supervisor Dashboard
        </h1>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard label="At Risk" value={summary.risk} color="red" />
          <SummaryCard label="Due Soon" value={summary.dueSoon} color="yellow" />
          <SummaryCard label="On Time" value={summary.onTime} color="blue" />
          <SummaryCard label="Graduated" value={summary.graduated} color="green" />
        </div>

        {/* SEARCH */}
        <input
          className="w-full p-3 border rounded-xl mb-6"
          placeholder="Search student…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading && <p>Loading students…</p>}

        {/* STUDENTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((st) => {
            const s = getStudentStatus(st);
            return (
              <div
                key={st.email}
                className="bg-white p-6 rounded-2xl shadow"
              >
                <div className="flex justify-between mb-2">
                  <h2 className="font-bold">{st.name}</h2>
                  <span className={`px-3 py-1 text-xs rounded-full ${s.color}`}>
                    {s.label}
                  </span>
                </div>

                <p><strong>Email:</strong> {st.email}</p>
                <p><strong>Programme:</strong> {st.programme}</p>
                <p className="text-2xl font-bold text-purple-700 mt-2">
                  {st.progressPercent}%
                </p>

                <button
                  onClick={() =>
                    router.push(`/supervisor/${st.email.toLowerCase()}`)
                  }
                  className="mt-3 text-purple-700 hover:underline"
                >
                  View Full Progress →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* =====================================================
   SMALL HELPER
===================================================== */
function SummaryCard({ label, value, color }) {
  const colors = {
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
  };

  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
