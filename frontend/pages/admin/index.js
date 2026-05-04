// ==========================================
// frontend/pages/admin/index.jsx
// MODERN PPBMS ADMIN DASHBOARD
// ==========================================

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Search,
  Bell,
  LogOut,
  FileBarChart2,
  ClipboardList,
  BookOpen,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { apiGet } from "@/utils/api";

/* ==========================================
   STATUS BADGE
========================================== */
function StatusBadge({ status }) {
  const normalized = status
    ?.toString()
    .toUpperCase()
    .trim();

  const config = {
    ON_TRACK: {
      label: "On Track",
      className:
        "bg-emerald-100 text-emerald-700 border border-emerald-200",
    },

    SLIGHTLY_DELAYED: {
      label: "Slightly Delayed",
      className:
        "bg-amber-100 text-amber-700 border border-amber-200",
    },

    AT_RISK: {
      label: "At Risk",
      className:
        "bg-red-100 text-red-700 border border-red-200",
    },

    GRADUATED: {
      label: "Graduated",
      className:
        "bg-blue-100 text-blue-700 border border-blue-200",
    },
  };

  const item = config[normalized] || {
    label: normalized,
    className:
      "bg-gray-100 text-gray-700 border border-gray-200",
  };

  return (
    <span
      className={`
        px-3 py-1 rounded-full
        text-xs font-semibold
        inline-flex items-center gap-1
        ${item.className}
      `}
    >
      {item.label}
    </span>
  );
}

/* ==========================================
   SUMMARY CARD
========================================== */
function SummaryCard({
  title,
  value,
  icon,
  color,
}) {
  return (
    <div
      className="
        bg-white rounded-3xl
        shadow-sm border border-gray-100
        p-5 transition hover:shadow-lg
      "
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h2
            className="
              text-4xl font-bold
              mt-2 text-slate-800
            "
          >
            {value}
          </h2>
        </div>

        <div
          className={`
            w-14 h-14 rounded-2xl
            flex items-center justify-center
            ${color}
          `}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   TIMELINE
========================================== */
function TimelineSection() {
  const steps = [
    {
      label: "Proposal",
      status: "done",
    },

    {
      label: "Ethics",
      status: "done",
    },

    {
      label: "Data Collection",
      status: "progress",
    },

    {
      label: "Analysis",
      status: "progress",
    },

    {
      label: "Thesis",
      status: "pending",
    },

    {
      label: "Viva",
      status: "pending",
    },
  ];

  return (
    <div
      className="
        bg-white rounded-3xl
        p-6 shadow-sm border
      "
    >
      <div className="flex items-center gap-2 mb-8">
        <ClipboardList
          className="text-purple-600"
          size={20}
        />

        <h2 className="font-bold text-lg">
          Milestone Timeline
        </h2>
      </div>

      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div
            key={i}
            className="
              flex-1 flex flex-col
              items-center relative
            "
          >
            {i !== steps.length - 1 && (
              <div
                className="
                  absolute top-4 left-1/2
                  w-full h-1
                  bg-gray-200 z-0
                "
              />
            )}

            <div
              className={`
                relative z-10
                w-8 h-8 rounded-full
                flex items-center
                justify-center text-white
                ${
                  step.status === "done"
                    ? "bg-emerald-500"

                    : step.status ===
                      "progress"
                    ? "bg-amber-500"

                    : "bg-gray-300"
                }
              `}
            >
              ✓
            </div>

            <p
              className="
                text-xs text-center
                mt-3 font-medium
              "
            >
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================
   PAGE
========================================== */
export default function AdminDashboard() {
  const router = useRouter();

  const [checked, setChecked] =
    useState(false);

  const [programmes, setProgrammes] =
    useState([]);

  const [programme, setProgramme] =
    useState("");

  const [summary, setSummary] =
    useState({
      onTrack: 0,
      slightlyDelayed: 0,
      atRisk: 0,
      graduated: 0,
    });

  const [graduates, setGraduates] =
    useState([]);

  const [
    activeStudents,
    setActiveStudents,
  ] = useState([]);

  const [cqi, setCQI] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  /* ==========================================
     AUTH
  ========================================== */
  useEffect(() => {
    if (!router.isReady) return;

    const token =
      localStorage.getItem(
        "ppbms_token"
      );

    const role =
      localStorage.getItem(
        "ppbms_role"
      );

    if (!token || role !== "admin") {
      localStorage.clear();

      router.replace("/login");

      return;
    }

    setChecked(true);
  }, [router.isReady]);

  /* ==========================================
     PROGRAMMES
  ========================================== */
  useEffect(() => {
    if (!checked) return;

    apiGet("/api/admin/programmes/students")
      .then((d) =>
        setProgrammes(
          d.programmes || []
        )
      )
      .catch(() =>
        setProgrammes([])
      );
  }, [checked]);

  /* ==========================================
     PROGRAMME DATA
  ========================================== */
  useEffect(() => {
    if (!programme) return;

    setLoading(true);

    Promise.all([
      apiGet(
        `/api/admin/programme-plo?programme=${programme}`
      ),

      apiGet(
        `/api/admin/programme-graduates?programme=${programme}`
      ),

      apiGet(
        `/api/admin/programme-active-students?programme=${programme}`
      ),

      apiGet(
        `/api/admin/programme-summary?programme=${programme}`
      ),
    ])

      .then(
        ([
          plo,
          grad,
          active,
          sum,
        ]) => {
          setCQI({
            plo: plo.plo || {},
            graduates:
              plo.graduates || 0,
          });

          setGraduates(
            grad.students || []
          );

          setActiveStudents(
            active.students || []
          );

          setSummary(
            sum || {
              onTrack: 0,
              slightlyDelayed: 0,
              atRisk: 0,
              graduated: 0,
            }
          );
        }
      )

      .finally(() =>
        setLoading(false)
      );
  }, [programme]);

  /* ==========================================
     FILTER
  ========================================== */
  const students = useMemo(() => {
    const all = [
      ...activeStudents,
      ...graduates,
    ];

    return all.filter((s) => {
      const q =
        search.toLowerCase();

      const matchesSearch =
        s.name
          ?.toLowerCase()
          .includes(q) ||
        s.matric
          ?.toLowerCase()
          .includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        s.status?.toUpperCase() ===
          statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    search,
    statusFilter,
    activeStudents,
    graduates,
  ]);

  /* ==========================================
     LOGOUT
  ========================================== */
  function handleLogout() {
    localStorage.clear();

    router.push("/login");
  }

  /* ==========================================
     CHART DATA
  ========================================== */
  const pieData = [
    {
      name: "On Track",
      value: summary.onTrack,
      color: "#10B981",
    },

    {
      name: "Delayed",
      value:
        summary.slightlyDelayed,
      color: "#F59E0B",
    },

    {
      name: "At Risk",
      value: summary.atRisk,
      color: "#EF4444",
    },

    {
      name: "Graduated",
      value: summary.graduated,
      color: "#3B82F6",
    },
  ];

  const barData = [
    {
      status: "On Track",
      students:
        summary.onTrack,
    },

    {
      status: "Delayed",
      students:
        summary.slightlyDelayed,
    },

    {
      status: "At Risk",
      students:
        summary.atRisk,
    },

    {
      status: "Graduated",
      students:
        summary.graduated,
    },
  ];

  if (!checked) {
    return (
      <div className="p-10">
        Checking access...
      </div>
    );
  }

  return (
    <div
      className="
        min-h-screen flex
        bg-slate-100
      "
    >
      {/* ==========================================
          SIDEBAR
      ========================================== */}
      <aside
        className="
          w-72 bg-gradient-to-b
          from-slate-900 to-slate-800
          text-white p-6
          hidden lg:flex
          flex-col
        "
      >
        <div className="mb-10">
          <h1
            className="
              text-3xl font-bold
              tracking-wide
            "
          >
            PPBMS
          </h1>

          <p
            className="
              text-slate-300 text-sm
              mt-1
            "
          >
            Admin Portal
          </p>
        </div>

        <nav className="space-y-2">

  <SidebarItem
    icon={<LayoutDashboard size={18} />}
    label="Dashboard"
    active={activeMenu === "dashboard"}
    onClick={() =>
      setActiveMenu("dashboard")
    }
  />

  <SidebarItem
    icon={<Users size={18} />}
    label="Students"
    active={activeMenu === "students"}
    onClick={() =>
      setActiveMenu("students")
    }
  />

  <SidebarItem
    icon={<GraduationCap size={18} />}
    label="Graduates"
    active={activeMenu === "graduates"}
    onClick={() =>
      setActiveMenu("graduates")
    }
  />

  <SidebarItem
    icon={<BookOpen size={18} />}
    label="Milestones"
    active={activeMenu === "milestones"}
    onClick={() =>
      setActiveMenu("milestones")
    }
  />

  <SidebarItem
    icon={<FileBarChart2 size={18} />}
    label="Reports"
    active={activeMenu === "reports"}
    onClick={() =>
      setActiveMenu("reports")
    }
  />

</nav>

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="
              w-full flex items-center
              gap-3 bg-red-500/20
              hover:bg-red-500/30
              transition p-3 rounded-2xl
              text-red-200
            "
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* ==========================================
          MAIN
      ========================================== */}
      <main
        className="
          flex-1 p-6 lg:p-8
          space-y-6 overflow-auto
        "
      >
        {/* HEADER */}
        <div
          className="
            flex flex-col lg:flex-row
            lg:items-center
            lg:justify-between
            gap-4
          "
        >
          <div>
            <h1
              className="
                text-3xl font-bold
                text-slate-800
              "
            >
              Admin Dashboard
            </h1>

            <p className="text-gray-500">
              PPBMS Monitoring &
              Analytics System
            </p>
          </div>

          <div
            className="
              flex items-center gap-4
            "
          >
            <button
              className="
                bg-white p-3 rounded-2xl
                shadow-sm border
              "
            >
              <Bell size={20} />
            </button>

            <button
              onClick={() =>
                router.push("/")
              }
              className="
                bg-purple-600 text-white
                px-5 py-3 rounded-2xl
                font-semibold shadow
              "
            >
              Landing Page
            </button>
          </div>
        </div>

        {/* PROGRAMME SELECT */}
        <div
          className="
            bg-white rounded-3xl
            p-5 shadow-sm border
          "
        >
          <label
            className="
              text-sm font-semibold
              text-gray-700 block mb-3
            "
          >
            Select Programme
          </label>

          <select
            value={programme}
            onChange={(e) =>
              setProgramme(
                e.target.value
              )
            }
            className="
              w-full p-4 rounded-2xl
              border border-gray-200
              focus:outline-none
              focus:ring-2
              focus:ring-purple-500
            "
          >
            <option value="">
              Choose Programme
            </option>

            {programmes.map((p) => (
              <option
                key={p}
                value={p}
              >
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* SUMMARY CARDS */}
        <div
          className="
            grid grid-cols-1
            md:grid-cols-2
            xl:grid-cols-4 gap-5
          "
        >
          <SummaryCard
            title="On Track"
            value={summary.onTrack}
            color="bg-emerald-100"
            icon={
              <CheckCircle2
                className="
                  text-emerald-600
                "
              />
            }
          />

          <SummaryCard
            title="Slightly Delayed"
            value={
              summary.slightlyDelayed
            }
            color="bg-amber-100"
            icon={
              <Clock3
                className="
                  text-amber-600
                "
              />
            }
          />

          <SummaryCard
            title="At Risk"
            value={summary.atRisk}
            color="bg-red-100"
            icon={
              <AlertTriangle
                className="
                  text-red-600
                "
              />
            }
          />

          <SummaryCard
            title="Graduated"
            value={summary.graduated}
            color="bg-blue-100"
            icon={
              <GraduationCap
                className="
                  text-blue-600
                "
              />
            }
          />
        </div>

        {/* CHARTS */}
        <div
          className="
            grid grid-cols-1
            xl:grid-cols-2 gap-6
          "
        >
          {/* PIE */}
          <div
            className="
              bg-white rounded-3xl
              shadow-sm border
              p-6
            "
          >
            <h2
              className="
                font-bold text-lg
                mb-6
              "
            >
              Student Distribution
            </h2>

            <div className="h-80">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={70}
                    outerRadius={110}
                    dataKey="value"
                  >
                    {pieData.map(
                      (entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            entry.color
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BAR */}
          <div
            className="
              bg-white rounded-3xl
              shadow-sm border
              p-6
            "
          >
            <h2
              className="
                font-bold text-lg
                mb-6
              "
            >
              Status Analytics
            </h2>

            <div className="h-80">
              <ResponsiveContainer>
                <BarChart
                  data={barData}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="status" />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="students"
                    radius={[
                      10, 10, 0, 0,
                    ]}
                    fill="#7C3AED"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TIMELINE */}
        <TimelineSection />

        {/* CQI */}
        {cqi && (
          <div
            className="
              bg-white rounded-3xl
              shadow-sm border p-6
            "
          >
            <h2
              className="
                text-xl font-bold
                mb-2
              "
            >
              Final Programme PLO
              Achievement
            </h2>

            <p
              className="
                text-sm text-gray-500
                mb-6
              "
            >
              Based on{" "}
              {cqi.graduates} graduate(s)
            </p>

            <div className="space-y-5">
              {Object.entries(
                cqi.plo
              ).map(([plo, v]) => (
                <div key={plo}>
                  <div
                    className="
                      flex justify-between
                      mb-2 text-sm
                    "
                  >
                    <span className="font-medium">
                      {plo}
                    </span>

                    <span>
                      {v.percent !== null
                        ? `${v.percent}%`
                        : "-"}
                    </span>
                  </div>

                  <div
                    className="
                      h-3 bg-gray-100
                      rounded-full overflow-hidden
                    "
                  >
                    <div
                      className={`
                        h-full rounded-full
                        ${
                          v.status ===
                          "Achieved"
                            ? "bg-emerald-500"
                            : v.status ===
                              "Borderline"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }
                      `}
                      style={{
                        width: `${
                          v.percent || 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH */}
        <div
          className="
            bg-white rounded-3xl
            p-5 shadow-sm border
            flex flex-col lg:flex-row
            gap-4
          "
        >
          <div className="relative flex-1">
            <Search
              size={18}
              className="
                absolute left-4 top-4
                text-gray-400
              "
            />

            <input
              type="text"
              placeholder="Search by name or matric..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="
                w-full pl-12 pr-4 py-4
                rounded-2xl border
                focus:outline-none
                focus:ring-2
                focus:ring-purple-500
              "
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="
              p-4 rounded-2xl border
              focus:outline-none
              focus:ring-2
              focus:ring-purple-500
            "
          >
            <option value="ALL">
              All Status
            </option>

            <option value="ON_TRACK">
              On Track
            </option>

            <option value="SLIGHTLY_DELAYED">
              Slightly Delayed
            </option>

            <option value="AT_RISK">
              At Risk
            </option>

            <option value="GRADUATED">
              Graduated
            </option>
          </select>
        </div>

        {/* TABLE */}
        <div
          className="
            bg-white rounded-3xl
            shadow-sm border
            overflow-hidden
          "
        >
          <div
            className="
              px-6 py-5 border-b
              flex justify-between
              items-center
            "
          >
            <div>
              <h2 className="font-bold">
                Student List
              </h2>

              <p
                className="
                  text-sm text-gray-500
                "
              >
                {students.length} student(s)
              </p>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full">
              <thead
                className="
                  bg-slate-50 border-b
                "
              >
                <tr>
                  <th
                    className="
                      text-left px-6 py-4
                      text-xs font-bold
                      uppercase text-gray-500
                    "
                  >
                    Student
                  </th>

                  <th
                    className="
                      text-left px-6 py-4
                      text-xs font-bold
                      uppercase text-gray-500
                    "
                  >
                    Matric
                  </th>

                  <th
                    className="
                      text-left px-6 py-4
                      text-xs font-bold
                      uppercase text-gray-500
                    "
                  >
                    Status
                  </th>

                  <th
                    className="
                      text-center px-6 py-4
                      text-xs font-bold
                      uppercase text-gray-500
                    "
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {students.map(
                  (s, index) => (
                    <tr
                      key={index}
                      className="
                        border-b hover:bg-slate-50
                        transition
                      "
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div
                            className="
                              w-11 h-11 rounded-full
                              bg-purple-100
                              flex items-center
                              justify-center
                              font-bold
                              text-purple-700
                            "
                          >
                            {s.name
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </div>

                          <div>
                            <div className="font-semibold">
                              {s.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        {s.matric}
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge
                          status={s.status}
                        />
                      </td>

                      <td
                        className="
                          px-6 py-5 text-center
                        "
                      >
                        <Link
                          href={`/admin/student/${encodeURIComponent(
                            s.email
                              .trim()
                              .toLowerCase()
                          )}`}
                          className="
                            inline-flex items-center
                            justify-center
                            px-4 py-2 rounded-xl
                            bg-purple-100
                            text-purple-700
                            hover:bg-purple-200
                            transition font-medium
                          "
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                )}

                {!students.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="
                        text-center py-10
                        text-gray-500
                      "
                    >
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {loading && (
          <div className="text-center">
            Loading dashboard...
          </div>
        )}
      </main>
    </div>
  );
}

/* ==========================================
   SIDEBAR ITEM
========================================== */
function SidebarItem({
  icon,
  label,
  active = false,
  onClick,
}) {
  return (
    <button
      onClick={onClick}

      className={`
        w-full flex items-center
        gap-3 px-4 py-3 rounded-2xl
        transition font-medium

        ${
          active
            ? "bg-purple-600 text-white shadow-lg"

            : "text-slate-300 hover:bg-slate-700"
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}
