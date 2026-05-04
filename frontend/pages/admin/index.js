// ==========================================
// MODERN UI (LOGIC UNCHANGED)
// ==========================================

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { apiGet } from "@/utils/api";

/* ==========================================
   STATUS BADGE
========================================== */
function StatusBadge({ status }) {
  const normalized = status?.toUpperCase()?.trim();

  const config = {
    ON_TRACK: "bg-blue-100 text-blue-700",
    SLIGHTLY_DELAYED: "bg-yellow-100 text-yellow-700",
    AT_RISK: "bg-red-100 text-red-700",
    GRADUATED: "bg-green-100 text-green-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config[normalized] || "bg-gray-100 text-gray-700"}`}>
      {normalized?.replaceAll("_", " ")}
    </span>
  );
}

/* ==========================================
   CARD
========================================== */
const Card = ({ title, value, color }) => (
  <div className={`p-5 rounded-2xl shadow-sm border ${color}`}>
    <p className="text-sm font-medium">{title}</p>
    <p className="text-3xl font-bold mt-1">{value}</p>
  </div>
);

/* ==========================================
   PAGE
========================================== */
export default function AdminDashboard() {

  const router = useRouter();

  const [checked, setChecked] = useState(false);
  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");
  const [cqi, setCQI] = useState(null);
  const [graduates, setGraduates] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);

  const [summary, setSummary] = useState({
    onTrack: 0,
    slightlyDelayed: 0,
    atRisk: 0,
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

  /* ================= PROGRAMMES ================= */
  useEffect(() => {
    if (!checked) return;

    apiGet("/api/admin/programmes/students")
      .then(d => setProgrammes(d.programmes || []))
      .catch(() => setProgrammes([]));

  }, [checked]);

  /* ================= DATA ================= */
  useEffect(() => {

    if (!programme) return;

    setLoading(true);

    Promise.all([
      apiGet(`/api/admin/programme-plo?programme=${programme}`),
      apiGet(`/api/admin/programme-graduates?programme=${programme}`),
      apiGet(`/api/admin/programme-active-students?programme=${programme}`),
      apiGet(`/api/admin/programme-summary?programme=${programme}`)
    ])

      .then(([plo, grad, active, sum]) => {

        setCQI({
          plo: plo.plo || {},
          graduates: plo.graduates || 0,
        });

        setGraduates(grad.students || []);
        setActiveStudents(active.students || []);
        setSummary(sum || {});

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
        s.status?.toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;

    });

  }, [search, statusFilter, activeStudents, graduates]);

  /* ================= LOGOUT ================= */
  function handleLogout() {
    localStorage.clear();
    router.push("/login");
  }

  if (!checked) return <div className="p-6">Checking access…</div>;

  /* ================= UI ================= */
  return (

    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center">

          <div>
            <h1 className="text-3xl font-bold text-purple-700">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 text-sm">
              PPBMS Monitoring System
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-purple-600 text-sm underline"
            >
              ← Landing
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-xl font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        {/* PROGRAMME */}
        <div className="bg-white p-4 rounded-2xl shadow border">
          <select
            value={programme}
            onChange={(e) => setProgramme(e.target.value)}
            className="w-full p-3 border rounded-xl"
          >
            <option value="">Select Programme</option>
            {programmes.map(p => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="On Track" value={summary.onTrack} color="bg-blue-50" />
          <Card title="Delayed" value={summary.slightlyDelayed} color="bg-yellow-50" />
          <Card title="At Risk" value={summary.atRisk} color="bg-red-50" />
          <Card title="Graduated" value={summary.graduated} color="bg-green-50" />
        </div>

        {/* CQI */}
        {cqi && (
          <div className="bg-white p-6 rounded-2xl shadow border">
            <h3 className="font-semibold mb-2">Final PLO Achievement</h3>
            <p className="text-xs text-gray-500 mb-4">
              Based on {cqi.graduates} graduate(s)
            </p>

            {Object.entries(cqi.plo).map(([plo, v]) => (
              <div key={plo} className="mb-3">
                <div className="flex justify-between text-sm">
                  <span>{plo}</span>
                  <span>{v.percent ?? "-"}%</span>
                </div>

                <div className="h-2 bg-gray-200 rounded">
                  <div
                    className={`h-2 rounded ${
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
          </div>
        )}

        {/* SEARCH */}
        <div className="flex flex-col md:flex-row gap-4">
          <input
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-3 border rounded-xl"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-3 border rounded-xl md:w-64"
          >
            <option value="ALL">All</option>
            <option value="ON_TRACK">On Track</option>
            <option value="SLIGHTLY_DELAYED">Delayed</option>
            <option value="AT_RISK">At Risk</option>
            <option value="GRADUATED">Graduated</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow border overflow-hidden">

          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold">Student List</h3>
            <p className="text-xs text-gray-500">
              {students.length} student(s)
            </p>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">

              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Matric</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-center">Profile</th>
                </tr>
              </thead>

              <tbody className="divide-y">

                {students.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{s.name}</td>
                    <td className="px-6 py-4">{s.matric}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/admin/student/${encodeURIComponent(s.email.trim().toLowerCase())}`}
                        className="text-purple-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {!students.length && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500">
                      No students found
                    </td>
                  </tr>
                )}

              </tbody>

            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
