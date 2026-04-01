import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { apiGet } from "@/utils/api";

/* ======================
   STATUS BADGE
====================== */
function StatusBadge({ status }) {
  const normalized = status
    ?.toString()
    .replace("_", " ")
    .toUpperCase();

  const map = {
    LATE: "bg-red-100 text-red-700",
    "ON TRACK": "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    GRADUATED: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        map[normalized] || "bg-gray-100 text-gray-700"
      }`}
    >
      {normalized}
    </span>
  );
}

/* ======================
   GLASS CARD
====================== */
const GlassCard = ({ children }) => (
  <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-white/40">
    {children}
  </div>
);

/* ======================
   PAGE
====================== */
export default function AdminDashboard() {
  const router = useRouter();

  function handleLogout() {
    localStorage.clear();
    router.push("/login");
  }

  const [checked, setChecked] = useState(false);
  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");

  const [cqi, setCQI] = useState(null);
  const [graduates, setGraduates] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);

  const [summary, setSummary] = useState({
    late: 0,
    onTrack: 0,
    graduated: 0,
  });

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  /* ================= AUTH ================= */
  useEffect(() => {
    if (!router.isReady) return;

    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");

    if (!token || role !== "admin") {
      localStorage.clear();
      router.replace("/login");
      return;
    }

    setChecked(true);
  }, [router.isReady]);

  /* ================= LOAD PROGRAMMES ================= */
  useEffect(() => {
    if (!checked) return;

    apiGet("/api/admin/programmes/students")
      .then(d => setProgrammes(d.programmes || []))
      .catch(() => setProgrammes([]));
  }, [checked]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!programme) return;

    setLoading(true);

    Promise.all([
      apiGet(`/api/admin/programme-plo?programme=${programme}`),
      apiGet(`/api/admin/programme-graduates?programme=${programme}`),
      apiGet(`/api/admin/programme-active-students?programme=${programme}`),
      apiGet(`/api/admin/programme-summary?programme=${programme}`),
    ])
      .then(([plo, grad, active, sum]) => {
        setCQI({
          plo: plo.plo || {},
          graduates: plo.graduates || 0,
        });

        setGraduates(
          (grad.students || []).map(s => ({
            ...s,
            status: "GRADUATED",
          }))
        );

        setActiveStudents(active.students || []);
        setSummary(sum || { late: 0, onTrack: 0, graduated: 0 });
      })
      .finally(() => setLoading(false));
  }, [programme]);

  /* ================= FILTER ================= */
  const students = useMemo(() => {
    const all = [...activeStudents, ...graduates];

    return all.filter(s => {
      const q = search.toLowerCase();

      const matchesSearch =
        s.name?.toLowerCase().includes(q) ||
        s.matric?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        s.status?.toUpperCase().replace("_", " ") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, activeStudents, graduates]);

  if (!checked) return <div className="p-6">Checking access…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#eef2ff] to-[#f1f5f9] p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-purple-700">
          Admin Dashboard
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-purple-600 text-sm hover:underline"
          >
            ← Landing
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-xl"
          >
            Logout
          </button>
        </div>
      </div>

      {/* PROGRAMME SELECT */}
      <GlassCard>
        <select
          className="w-full p-3 rounded-xl border bg-white"
          value={programme}
          onChange={e => setProgramme(e.target.value)}
        >
          <option value="">Select Programme</option>
          {programmes.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </GlassCard>

      {loading && <p className="text-gray-500 mt-4">Loading…</p>}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

        <GlassCard>
          <p className="text-sm text-gray-500">Late</p>
          <p className="text-2xl font-bold text-red-600">{summary.late}</p>
        </GlassCard>

        <GlassCard>
          <p className="text-sm text-gray-500">On Track</p>
          <p className="text-2xl font-bold text-blue-600">{summary.onTrack}</p>
        </GlassCard>

        <GlassCard>
          <p className="text-sm text-gray-500">Graduated</p>
          <p className="text-2xl font-bold text-green-600">{summary.graduated}</p>
        </GlassCard>

      </div>

      {/* PLO */}
      {cqi && (
        <GlassCard>
          <h3 className="font-semibold mb-3">
            Programme PLO Achievement
          </h3>

          {Object.entries(cqi.plo).map(([plo, v]) => (
            <div key={plo} className="mb-3">
              <div className="flex justify-between text-sm">
                <span>{plo}</span>
                <span>{v.percent ?? "-"}%</span>
              </div>

              <div className="h-2 bg-gray-200 rounded-full mt-1">
                <div
                  className={`h-2 rounded-full ${
                    v.status === "Achieved"
                      ? "bg-green-500"
                      : v.status === "Borderline"
                      ? "bg-yellow-400"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${v.percent || 0}%` }}
                />
              </div>
            </div>
          ))}
        </GlassCard>
      )}

      {/* SEARCH */}
      <div className="flex gap-4 mt-6">
        <input
          type="text"
          placeholder="Search student…"
          className="flex-1 p-3 rounded-xl border"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          className="p-3 rounded-xl border"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All</option>
          <option value="ON TRACK">On Track</option>
          <option value="LATE">Late</option>
          <option value="GRADUATED">Graduated</option>
        </select>
      </div>

      {/* STUDENTS */}
      <div className="mt-6 space-y-3">
        {students.map((s, i) => (
          <GlassCard key={i}>
            <div className="flex justify-between items-center">

              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-gray-500">{s.matric}</p>
              </div>

              <div className="flex items-center gap-4">
                <StatusBadge status={s.status} />

                <Link
                  href={`/admin/student/${encodeURIComponent(
                    s.email.trim().toLowerCase()
                  )}`}
                  className="text-purple-600 text-sm hover:underline"
                >
                  View →
                </Link>
              </div>

            </div>
          </GlassCard>
        ))}

        {!students.length && (
          <GlassCard>
            <p className="text-center text-gray-500">
              No students found
            </p>
          </GlassCard>
        )}
      </div>

    </div>
  );
}
