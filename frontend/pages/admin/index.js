// ==========================================
// ADMIN DASHBOARD (FINAL CLEAN VERSION)
// ==========================================

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { apiGet } from "@/utils/api";

/* ==========================================
   SIDEBAR
========================================== */
function Sidebar({ onLogout }) {
  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-6">
      <h2 className="text-xl font-bold mb-6">PPBMS</h2>

      <div className="space-y-3">
        <Link href="/admin" className="block hover:underline">
          Dashboard
        </Link>
      </div>

      <button
        onClick={onLogout}
        className="mt-10 bg-red-500 px-4 py-2 rounded-xl w-full"
      >
        Logout
      </button>
    </div>
  );
}

/* ==========================================
   STATUS BADGE
========================================== */
function StatusBadge({ status }) {
  const s = status?.toUpperCase();

  const map = {
    ON_TRACK: "bg-blue-100 text-blue-700",
    SLIGHTLY_DELAYED: "bg-yellow-100 text-yellow-700",
    AT_RISK: "bg-red-100 text-red-700",
    GRADUATED: "bg-green-100 text-green-700",
    TERMINATED: "bg-gray-200 text-gray-700",
    SUSPENDED: "bg-orange-100 text-orange-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs ${map[s] || "bg-gray-100"}`}>
      {s}
    </span>
  );
}

/* ==========================================
   PAGE
========================================== */
export default function AdminDashboard() {

  const router = useRouter();

  const [checked, setChecked] = useState(false);
  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");

  const [summary, setSummary] = useState({});
  const [students, setStudents] = useState([]);
  const [plo, setPlo] = useState({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

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

    apiGet("/api/admin/programmes")
      .then(d => {
        setProgrammes(d.programmes || []);
        if (d.programmes?.length) {
          setProgramme(d.programmes[0]);
        }
      });

  }, [checked]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {

    if (!programme) return;

    setLoading(true);

    Promise.all([
      apiGet(`/api/admin/programme-summary?programme=${programme}`),
      apiGet(`/api/admin/programme-students?programme=${programme}`),
      apiGet(`/api/admin/programme-plo?programme=${programme}`)
    ])
      .then(([sum, stu, p]) => {

        setSummary(sum || {});
        setStudents(stu.students || []);
        setPlo(p || {});

      })
      .finally(() => setLoading(false));

  }, [programme]);

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {

    return students.filter(s => {

      const q = search.toLowerCase();

      const matchSearch =
        s.name?.toLowerCase().includes(q) ||
        s.matric?.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "ALL" ||
        s.overallStatus === statusFilter ||
        s.status === statusFilter;

      return matchSearch && matchStatus;
    });

  }, [students, search, statusFilter]);

  /* ================= LOGOUT ================= */
  function handleLogout() {
    localStorage.clear();
    router.push("/login");
  }

  if (!checked) return <div className="p-6">Checking access...</div>;

  return (
    <div className="flex">

      {/* SIDEBAR */}
      <Sidebar onLogout={handleLogout} />

      {/* MAIN */}
      <div className="flex-1 p-6 space-y-6">

        <h1 className="text-2xl font-bold text-purple-700">
          Admin Dashboard
        </h1>

        {/* PROGRAMME */}
        <select
          value={programme}
          onChange={e => setProgramme(e.target.value)}
          className="p-3 border rounded-xl w-full"
        >
          {programmes.map(p => (
            <option key={p}>{p}</option>
          ))}
        </select>

        {/* SUMMARY */}
        <div className="grid md:grid-cols-4 gap-4">

          <div className="bg-blue-100 p-4 rounded-xl">
            <p>On Track</p>
            <h2>{summary.onTrack || 0}</h2>
          </div>

          <div className="bg-yellow-100 p-4 rounded-xl">
            <p>Delayed</p>
            <h2>{summary.slightlyDelayed || 0}</h2>
          </div>

          <div className="bg-red-100 p-4 rounded-xl">
            <p>At Risk</p>
            <h2>{summary.atRisk || 0}</h2>
          </div>

          <div className="bg-green-100 p-4 rounded-xl">
            <p>Graduated</p>
            <h2>{summary.graduated || 0}</h2>
          </div>

        </div>

        {/* PLO */}
        <div className="bg-white p-6 rounded-xl shadow">

          <h3 className="font-semibold mb-2">
            Programme PLO (Graduated: {plo.count || 0})
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {plo.plos &&
              Object.entries(plo.plos).map(([k, v]) => (
                <div key={k} className="bg-gray-100 p-3 rounded">
                  {k}: {v}
                </div>
              ))}
          </div>

        </div>

        {/* SEARCH + FILTER */}
        <div className="flex gap-3">

          <input
            placeholder="Search..."
            className="p-3 border rounded-xl flex-1"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-3 border rounded-xl"
          >
            <option value="ALL">All</option>
            <option value="ON_TRACK">On Track</option>
            <option value="SLIGHTLY_DELAYED">Delayed</option>
            <option value="AT_RISK">At Risk</option>
            <option value="GRADUATED">Graduated</option>
            <option value="TERMINATED">Terminated</option>
            <option value="SUSPENDED">Suspension</option>
          </select>

        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow overflow-hidden">

          <table className="w-full text-sm">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Matric</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Profile</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((s, i) => (
                <tr key={i} className="border-t">

                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.matric}</td>

                  <td className="p-3">
                    <StatusBadge status={s.overallStatus} />
                  </td>

                  <td className="p-3 text-center">
                    <Link
                      href={`/admin/student/${encodeURIComponent(s.email)}`}
                      className="text-purple-600 underline"
                    >
                      View
                    </Link>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

        </div>

      </div>
    </div>
  );
}
