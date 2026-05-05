import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { apiGet } from "@/utils/api";

/* ================= BADGE ================= */
function StatusBadge({ status }) {
  const map = {
    "On Track": "bg-green-100 text-green-700",
    "Slightly Late": "bg-yellow-100 text-yellow-700",
    "At Risk": "bg-red-100 text-red-700",
    "Graduated": "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

/* ================= PLO CARD ================= */
function PLOCard({ plo, value }) {
  let color = "bg-green-100 text-green-700";

  if (value < 4 && value >= 3) color = "bg-yellow-100 text-yellow-700";
  if (value < 3) color = "bg-red-100 text-red-700";

  return (
    <div className={`rounded-xl p-3 text-center ${color}`}>
      <p className="text-xs">{plo}</p>
      <h3 className="font-bold">{value ?? "-"}</h3>
    </div>
  );
}

export default function AdminDashboard() {

  const router = useRouter();

  const [checked, setChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");

  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const [ploStats, setPloStats] = useState({}); // 🔥 NEW

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  /* ================= AUTH ================= */
  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");

    if (!token || role !== "admin") {
      localStorage.clear();
      router.replace("/login");
      return;
    }

    setChecked(true);
  }, []);

  /* ================= LOAD PROGRAMMES ================= */
  useEffect(() => {
    if (!checked) return;

    apiGet("/api/admin/programmes/students")
      .then(d => setProgrammes(d.programmes || []));
  }, [checked]);

  /* ================= AUTO SELECT ================= */
  useEffect(() => {
    if (programmes.length > 0 && !programme) {
      setProgramme(programmes[0]);
    }
  }, [programmes]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {

    if (!programme) return;

    Promise.all([
      apiGet(`/api/admin/programme-active-students?programme=${programme}`),
      apiGet(`/api/admin/programme-graduates?programme=${programme}`),
      apiGet(`/api/admin/programme-summary?programme=${programme}`),
      apiGet(`/api/admin/programme-plo?programme=${programme}`) // 🔥 NEW
    ])
    .then(([active, grad, sum, plo]) => {

      setStudents([
        ...(active.students || []),
        ...(grad.students || [])
      ]);

      setSummary(sum || {});
      setPloStats(plo || {});
    });

  }, [programme]);

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    return students.filter(st => {

      const q = search.toLowerCase();

      const matchSearch =
        st.name?.toLowerCase().includes(q) ||
        st.email?.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "All" ||
        st.status === statusFilter;

      return matchSearch && matchStatus;

    });
  }, [students, search, statusFilter]);

  if (!checked) return <div className="p-6">Checking...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* ================= SIDEBAR ================= */}
      <aside className={`
        fixed lg:static z-50
        w-64 h-full bg-gradient-to-b from-indigo-900 to-purple-800 text-white p-6
        transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        <h2 className="text-xl font-bold mb-6">PPBMS</h2>

        <button onClick={() => router.push("/admin")} className="block mb-3">
          Dashboard
        </button>

        <button onClick={() => router.push("/admin/cqi")} className="block">
          CQI Analytics
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-6 space-y-6">

        <button onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>

        <h1 className="text-2xl font-bold text-purple-700">
          Admin Dashboard
        </h1>

        {/* ================= PROGRAMME ================= */}
        <select
          value={programme}
          onChange={(e) => setProgramme(e.target.value)}
          className="w-full p-3 border rounded-xl"
        >
          {programmes.map(p => (
            <option key={p}>{p}</option>
          ))}
        </select>

        {/* ================= KPI ================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <div className="bg-green-100 p-4 rounded-xl">
            <p className="text-xs">On Track</p>
            <h2 className="text-xl font-bold">{summary.onTrack || 0}</h2>
          </div>

          <div className="bg-yellow-100 p-4 rounded-xl">
            <p className="text-xs">Slightly Late</p>
            <h2 className="text-xl font-bold">{summary.slightlyDelayed || 0}</h2>
          </div>

          <div className="bg-red-100 p-4 rounded-xl">
            <p className="text-xs">At Risk</p>
            <h2 className="text-xl font-bold">{summary.atRisk || 0}</h2>
          </div>

          <div className="bg-blue-100 p-4 rounded-xl">
            <p className="text-xs">Graduated</p>
            <h2 className="text-xl font-bold">{summary.graduated || 0}</h2>
          </div>

        </div>

        {/* ================= PLO ANALYTICS ================= */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold mb-4">Programme PLO Attainment</h3>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Object.keys(ploStats).map((plo) => (
              <PLOCard key={plo} plo={plo} value={ploStats[plo]} />
            ))}
          </div>
        </div>

        {/* ================= SEARCH ================= */}
        <input
          placeholder="Search student..."
          className="w-full p-3 border rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* ================= FILTER ================= */}
        <div className="flex gap-2 flex-wrap">
          {["All","On Track","Slightly Late","At Risk","Graduated"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === s
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* ================= STUDENT LIST ================= */}
        <div className="bg-white rounded-xl shadow divide-y">

          {filtered.map((s, i) => (
            <div key={i} className="p-4 flex justify-between items-center">

              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-gray-500">{s.email}</p>
                <p className="text-xs text-gray-400">
                  Progress: {s.progressPercent}%
                </p>
              </div>

              <div className="flex gap-3 items-center">

                <StatusBadge status={s.status} />

                <Link
                  href={{
                    pathname: "/admin/student/[email]",
                    query: { email: s.email }
                  }}
                  className="text-purple-600 text-sm"
                >
                  View →
                </Link>

              </div>

            </div>
          ))}

        </div>

      </main>
    </div>
  );
}
