// ==========================================
// FINAL ADMIN DASHBOARD (RESPONSIVE + FIXED)
// ==========================================

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { apiGet } from "@/utils/api";

/* =========================
   PROGRESS LOGIC (SYNC WITH SUPERVISOR)
========================= */
function calculateProgress(st) {
  const timeline = Array.isArray(st.timeline) ? st.timeline : [];

  if (timeline.length === 0) {
    return st.progressPercent || 0;
  }

  const completed = timeline.filter(
    (t) =>
      t.status === "Completed" ||
      t.status === "COMPLETED"
  ).length;

  return Math.round((completed / timeline.length) * 100);
}

function getStudentCategory(st) {
  if (
    st.status?.toLowerCase() === "graduated" ||
    st.status?.toLowerCase() === "completed"
  ) {
    return "Graduated";
  }

  const p = calculateProgress(st);

  if (p >= 80) return "On Track";
  if (p >= 50) return "Slightly Late";
  return "At Risk";
}

/* =========================
   STATUS BADGE
========================= */
function StatusBadge({ student }) {
  const category = getStudentCategory(student);

  const map = {
    "Graduated": "bg-blue-100 text-blue-700",
    "On Track": "bg-green-100 text-green-700",
    "Slightly Late": "bg-yellow-100 text-yellow-700",
    "At Risk": "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[category]}`}>
      {category}
    </span>
  );
}

/* =========================
   PAGE
========================= */
export default function AdminDashboard() {
  const router = useRouter();

  const [checked, setChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");

  const [activeStudents, setActiveStudents] = useState([]);
  const [graduates, setGraduates] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  /* ================= AUTH ================= */
  useEffect(() => {
    if (!router.isReady) return;

    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");

    if (!token || role !== "admin") {
      router.replace("/login");
      return;
    }

    setChecked(true);
  }, [router.isReady]);

  /* ================= LOAD PROGRAMMES ================= */
  useEffect(() => {
    if (!checked) return;

    apiGet("/api/admin/programmes/students")
      .then((d) => setProgrammes(d.programmes || []))
      .catch(() => setProgrammes([]));
  }, [checked]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!programme) return;

    Promise.all([
      apiGet(`/api/admin/programme-active-students?programme=${programme}`),
      apiGet(`/api/admin/programme-graduates?programme=${programme}`),
    ]).then(([active, grad]) => {
      setActiveStudents(active.students || []);
      setGraduates(grad.students || []);
    });
  }, [programme]);

  /* ================= FILTER ================= */
  const students = useMemo(() => {
    let all = [...activeStudents, ...graduates];

    if (search) {
      const s = search.toLowerCase();

      all = all.filter(
        (st) =>
          st.name?.toLowerCase().includes(s) ||
          st.email?.toLowerCase().includes(s)
      );
    }

    if (statusFilter !== "All") {
      all = all.filter(
        (st) => getStudentCategory(st) === statusFilter
      );
    }

    return all;
  }, [activeStudents, graduates, search, statusFilter]);

  /* ================= KPI ================= */
  const onTrack = students.filter(s => getStudentCategory(s) === "On Track").length;
  const slightlyLate = students.filter(s => getStudentCategory(s) === "Slightly Late").length;
  const atRisk = students.filter(s => getStudentCategory(s) === "At Risk").length;
  const graduated = students.filter(s => getStudentCategory(s) === "Graduated").length;

  if (!checked) return <div className="p-6">Checking...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:static z-50
        w-64 h-full bg-purple-900 text-white p-6
        transform transition
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        <h2 className="text-xl font-bold mb-6">PPBMS Admin</h2>

        <button
          onClick={() => router.push("/")}
          className="block mb-4"
        >
          Dashboard
        </button>

        <button
          onClick={() => {
            localStorage.clear();
            router.push("/login");
          }}
          className="mt-10 text-red-300"
        >
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <button
            className="lg:hidden bg-white p-2 rounded"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <h1 className="text-2xl font-bold">
            Admin Dashboard
          </h1>
        </div>

        {/* PROGRAMME */}
        <select
          value={programme}
          onChange={(e) => setProgramme(e.target.value)}
          className="p-3 border rounded w-full"
        >
          <option>Select Programme</option>
          {programmes.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-100 p-4 rounded">On Track: {onTrack}</div>
          <div className="bg-yellow-100 p-4 rounded">Delayed: {slightlyLate}</div>
          <div className="bg-red-100 p-4 rounded">At Risk: {atRisk}</div>
          <div className="bg-blue-100 p-4 rounded">Graduated: {graduated}</div>
        </div>

        {/* SEARCH */}
        <input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-3 border w-full"
        />

        {/* FILTER */}
        <div className="flex gap-2 flex-wrap">
          {["All","On Track","Slightly Late","At Risk","Graduated"].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-2 rounded ${
                statusFilter === f ? "bg-purple-600 text-white" : "bg-white border"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="bg-white rounded p-4">
          {students.map((s, i) => (
            <div key={i} className="flex justify-between border-b py-3">
              <div>
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-gray-500">{s.email}</div>
              </div>

              <StatusBadge student={s} />

              <Link href={`/admin/student/${encodeURIComponent(s.email)}`}>
                View
              </Link>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
