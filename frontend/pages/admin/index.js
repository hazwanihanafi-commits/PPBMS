import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { apiGet } from "@/utils/api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

/* ==========================================
   SIDEBAR
========================================== */
function Sidebar({ onLogout }) {

  return (

    <div
      className="
        w-64 min-h-screen
        bg-gradient-to-b
        from-gray-900
        to-slate-950
        text-white
        p-6
      "
    >

      <h2
        className="
          text-2xl font-bold
          mb-10
        "
      >
        PPBMS
      </h2>

      <div className="space-y-3">

        <Link
          href="/admin"
          className="
            block px-4 py-3
            rounded-xl
            bg-purple-600/20
            hover:bg-purple-600/30
            transition
          "
        >
          Dashboard
        </Link>

      </div>

      <button
        onClick={onLogout}

        className="
          mt-10 w-full
          bg-red-500 hover:bg-red-600
          transition
          px-4 py-3
          rounded-xl
          font-semibold
        "
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

  const map = {

    ON_TRACK:
      "bg-blue-100 text-blue-700",

    SLIGHTLY_DELAYED:
      "bg-yellow-100 text-yellow-700",

    AT_RISK:
      "bg-red-100 text-red-700",

    GRADUATED:
      "bg-green-100 text-green-700"
  };

  return (

    <span
      className={`
        px-3 py-1
        rounded-full
        text-xs
        font-semibold
        tracking-wide
        ${map[status]}
      `}
    >
      {status}
    </span>
  );
}

/* ==========================================
   PLO CHART
========================================== */
function PLOChart({ plos }) {

  if (!plos) return null;

  const sortedKeys =
    Object.keys(plos)
      .sort((a, b) =>
        Number(a.replace("PLO", "")) -
        Number(b.replace("PLO", ""))
      );

  return (

    <Bar

      data={{
        labels: sortedKeys,

        datasets: [
          {
            label: "PLO Score",

            data:
              sortedKeys.map(k =>
                Number(plos[k])
              ),

            backgroundColor:
              sortedKeys.map((_, i) => {

                const colors = [

                  "#7c3aed",
                  "#2563eb",
                  "#16a34a",
                  "#ca8a04",
                  "#dc2626"
                ];

                return colors[
                  i % colors.length
                ];
              }),

            borderRadius: 10
          }
        ]
      }}

      options={{

        responsive: true,

        plugins: {

          legend: {
            display: false
          }
        },

        scales: {

          y: {
            beginAtZero: true,
            max: 5
          }
        }
      }}
    />
  );
}

/* ==========================================
   PAGE
========================================== */
export default function AdminDashboard() {

  const router = useRouter();

  const [checked, setChecked] =
    useState(false);

  const [programme, setProgramme] =
    useState("");

  const [programmes, setProgrammes] =
    useState([]);

  const [summary, setSummary] =
    useState({});

  const [students, setStudents] =
    useState([]);

  const [plo, setPlo] =
    useState({});

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  /* ==========================================
     AUTH
  ========================================== */
  useEffect(() => {

    const token =
      localStorage.getItem(
        "ppbms_token"
      );

    if (!token) {

      router.replace("/login");

      return;
    }

    setChecked(true);

  }, []);

  /* ==========================================
     LOAD PROGRAMMES
  ========================================== */
  useEffect(() => {

    if (!checked) return;

    apiGet("/api/admin/programmes")

      .then(d => {

        setProgrammes(
          d.programmes || []
        );

        if (
          d.programmes?.length
        ) {

          setProgramme(
            d.programmes[0]
          );
        }
      });

  }, [checked]);

  /* ==========================================
     LOAD DATA
  ========================================== */
  useEffect(() => {

    if (!programme) return;

    Promise.all([

      apiGet(
        `/api/admin/programme-summary?programme=${programme}`
      ),

      apiGet(
        `/api/admin/programme-students?programme=${programme}`
      ),

      apiGet(
        `/api/admin/programme-plo?programme=${programme}`
      )

    ])

    .then(([sum, stu, p]) => {

      setSummary(sum || {});
      setStudents(stu.students || []);
      setPlo(p || {});
    });

  }, [programme]);

  /* ==========================================
     FILTER
  ========================================== */
  const filtered = useMemo(() => {

    let list = [...students];

    /* SEARCH */
    if (search.trim()) {

      const q =
        search.toLowerCase();

      list = list.filter(s =>

        s.name
          ?.toLowerCase()
          .includes(q)

        ||

        s.matric
          ?.toLowerCase()
          .includes(q)
      );
    }

    /* STATUS */
    if (
      statusFilter !== "ALL"
    ) {

      list = list.filter(s =>

        s.overallStatus ===
        statusFilter
      );
    }

    /* SORT */
    const statusOrder = {

      AT_RISK: 1,

      SLIGHTLY_DELAYED: 2,

      ON_TRACK: 3,

      GRADUATED: 4
    };

    list.sort((a, b) =>

      (statusOrder[a.overallStatus] || 99)

      -

      (statusOrder[b.overallStatus] || 99)
    );

    return list;

  }, [
    students,
    search,
    statusFilter
  ]);

  /* ==========================================
     LOGOUT
  ========================================== */
  function logout() {

    localStorage.clear();

    router.push("/login");
  }

  if (!checked) {

    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  /* ==========================================
     UI
  ========================================== */
  return (

    <div className="flex bg-gray-50 min-h-screen">

      {/* SIDEBAR */}
      <Sidebar onLogout={logout} />

      {/* MAIN */}
      <div className="flex-1 p-6 space-y-6">

        {/* HEADER */}
        <div>

          <h1
            className="
              text-3xl font-bold
              text-purple-700
            "
          >
            Admin Dashboard
          </h1>

          <p className="text-gray-500 mt-1">
            Postgraduate Programme Monitoring
          </p>

        </div>

        {/* PROGRAMME */}
        <select

          value={programme}

          onChange={e =>
            setProgramme(
              e.target.value
            )
          }

          className="
            p-4 border
            rounded-2xl
            w-full bg-white
            shadow-sm
          "
        >

          {programmes.map(p => (

            <option
              key={p}
            >
              {p}
            </option>
          ))}

        </select>

        {/* KPI */}
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-4
            gap-5
          "
        >

          <div
            className="
              bg-blue-100
              p-5 rounded-2xl
              shadow-sm
            "
          >

            <p className="text-sm text-gray-600">
              On Track
            </p>

            <h2
              className="
                text-3xl font-bold
                text-blue-700
              "
            >
              {summary.onTrack || 0}
            </h2>

          </div>

          <div
            className="
              bg-yellow-100
              p-5 rounded-2xl
              shadow-sm
            "
          >

            <p className="text-sm text-gray-600">
              Slightly Delayed
            </p>

            <h2
              className="
                text-3xl font-bold
                text-yellow-700
              "
            >
              {summary.slightlyDelayed || 0}
            </h2>

          </div>

          <div
            className="
              bg-red-100
              p-5 rounded-2xl
              shadow-sm
            "
          >

            <p className="text-sm text-gray-600">
              At Risk
            </p>

            <h2
              className="
                text-3xl font-bold
                text-red-700
              "
            >
              {summary.atRisk || 0}
            </h2>

          </div>

          <div
            className="
              bg-green-100
              p-5 rounded-2xl
              shadow-sm
            "
          >

            <p className="text-sm text-gray-600">
              Graduated
            </p>

            <h2
              className="
                text-3xl font-bold
                text-green-700
              "
            >
              {summary.graduated || 0}
            </h2>

          </div>

        </div>

        {/* PLO */}
        <div
          className="
            bg-white
            p-6 rounded-2xl
            shadow-sm
          "
        >

          <div className="mb-4">

            <h3 className="text-lg font-bold">
              Programme PLO Achievement
            </h3>

            <p className="text-sm text-gray-500">
              Based on {plo.count || 0} graduated student(s)
            </p>

          </div>

          <PLOChart
            plos={plo.plos}
          />

        </div>

        {/* FILTERS */}
        <div
          className="
            flex flex-col
            md:flex-row
            gap-4
          "
        >

          <input

            placeholder="Search student..."

            className="
              p-4 border
              rounded-2xl
              flex-1 bg-white
            "

            onChange={e =>
              setSearch(
                e.target.value
              )
            }
          />

          <select

            onChange={e =>
              setStatusFilter(
                e.target.value
              )
            }

            className="
              p-4 border
              rounded-2xl
              bg-white
              w-full md:w-64
            "
          >

            <option value="ALL">
              All
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
            bg-white
            rounded-2xl
            shadow-sm
            overflow-hidden
          "
        >

          <table className="w-full">

            <thead
              className="
                bg-gradient-to-r
                from-purple-50
                to-indigo-50
                border-b
              "
            >

              <tr>

                <th
                  className="
                    px-6 py-4
                    text-left text-xs
                    font-bold uppercase
                    tracking-wider
                    text-gray-700
                  "
                >
                  Student Name
                </th>

                <th
                  className="
                    px-6 py-4
                    text-left text-xs
                    font-bold uppercase
                    tracking-wider
                    text-gray-700
                  "
                >
                  Matric No
                </th>

                <th
                  className="
                    px-6 py-4
                    text-left text-xs
                    font-bold uppercase
                    tracking-wider
                    text-gray-700
                  "
                >
                  Status
                </th>

                <th
                  className="
                    px-6 py-4
                    text-center text-xs
                    font-bold uppercase
                    tracking-wider
                    text-gray-700
                  "
                >
                  Profile
                </th>

              </tr>

            </thead>

            <tbody>

              {filtered.map(s => (

                <tr

                  key={s.matric}

                  className="
                    border-b
                    hover:bg-gray-50
                    transition
                  "
                >

                  <td
                    className="
                      px-6 py-4
                      font-medium
                    "
                  >
                    {s.name}
                  </td>

                  <td className="px-6 py-4">
                    {s.matric}
                  </td>

                  <td className="px-6 py-4">

                    <StatusBadge
                      status={s.overallStatus}
                    />

                  </td>

                  <td
                    className="
                      px-6 py-4
                      text-center
                    "
                  >

                    <Link

                      href={`/admin/student/${s.email}`}

                      className="
                        text-purple-600
                        hover:underline
                        font-medium
                      "
                    >
                      View
                    </Link>

                  </td>

                </tr>
              ))}

              {filtered.length === 0 && (

                <tr>

                  <td

                    colSpan={4}

                    className="
                      text-center
                      py-10
                      text-gray-400
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

    </div>
  );
}
