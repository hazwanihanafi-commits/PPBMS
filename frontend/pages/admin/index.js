import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { apiGet } from "@/utils/api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement);

/* ==========================================
   SIDEBAR
========================================== */
function Sidebar({ onLogout }) {
  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-6">
      <h2 className="text-xl font-bold mb-6">PPBMS</h2>
      <Link href="/admin" className="block mb-4">Dashboard</Link>
      <button onClick={onLogout} className="bg-red-500 px-4 py-2 rounded-xl w-full">
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
    ON_TRACK: "bg-blue-100 text-blue-700",
    SLIGHTLY_DELAYED: "bg-yellow-100 text-yellow-700",
    AT_RISK: "bg-red-100 text-red-700",
    GRADUATED: "bg-green-100 text-green-700"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs ${map[status]}`}>
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
              "#7c3aed",

            borderRadius: 8
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

  const [checked, setChecked] = useState(false);
  const [programme, setProgramme] = useState("");
  const [programmes, setProgrammes] = useState([]);

  const [summary, setSummary] = useState({});
  const [students, setStudents] = useState([]);
  const [plo, setPlo] = useState({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  /* AUTH */
  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");
    if (!token) return router.replace("/login");
    setChecked(true);
  }, []);

  /* LOAD PROGRAMMES */
  useEffect(() => {
    if (!checked) return;

    apiGet("/api/admin/programmes")
      .then(d => {
        setProgrammes(d.programmes || []);
        setProgramme(d.programmes[0]);
      });
  }, [checked]);

  /* LOAD DATA */
  useEffect(() => {

    if (!programme) return;

    Promise.all([
      apiGet(`/api/admin/programme-summary?programme=${programme}`),
      apiGet(`/api/admin/programme-students?programme=${programme}`),
      apiGet(`/api/admin/programme-plo?programme=${programme}`)
    ])
    .then(([sum, stu, p]) => {
      setSummary(sum);
      setStudents(stu.students);
      setPlo(p);
    });

  }, [programme]);

  /* FILTER */
  /* FILTER + SORT */
const filtered = useMemo(() => {

  const q =
    search.toLowerCase();

  let list = students.filter(s => {

    const matchSearch =

      s.name
        ?.toLowerCase()
        .includes(q) ||

      s.matric
        ?.toLowerCase()
        .includes(q);

    const matchStatus =

      statusFilter === "ALL"

        ? true

        : s.overallStatus ===
          statusFilter;

    return (
      matchSearch &&
      matchStatus
    );

  });

  /* =========================
     SORT STATUS
  ========================= */

  const statusOrder = {

    AT_RISK: 1,

    SLIGHTLY_DELAYED: 2,

    ON_TRACK: 3,

    GRADUATED: 4

  };

  list.sort((a, b) => {

    const statusA =
      statusOrder[
        a.overallStatus
      ] || 99;

    const statusB =
      statusOrder[
        b.overallStatus
      ] || 99;

    /* SORT STATUS FIRST */
    if (statusA !== statusB) {

      return (
        statusA - statusB
      );
    }

    /* THEN NAME */
    return (
      a.name || ""
    ).localeCompare(
      b.name || ""
    );

  });

  return list;

}, [
  students,
  search,
  statusFilter
]);

  function logout() {
    localStorage.clear();
    router.push("/login");
  }

  if (!checked) return <div>Loading...</div>;

  return (
    <div className="flex">

      <Sidebar onLogout={logout} />

      <div className="flex-1 p-6 space-y-6">

        <h1 className="text-2xl font-bold text-purple-700">
          Admin Dashboard
        </h1>

        {/* Programme */}
        <select
          value={programme}
          onChange={e => setProgramme(e.target.value)}
          className="p-3 border rounded-xl w-full"
        >
          {programmes.map(p => (
            <option key={p}>{p}</option>
          ))}
        </select>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4">

          <div className="bg-blue-100 p-4 rounded-xl">
            On Track {summary.onTrack}
          </div>

          <div className="bg-yellow-100 p-4 rounded-xl">
            Delayed {summary.slightlyDelayed}
          </div>

          <div className="bg-red-100 p-4 rounded-xl">
            At Risk {summary.atRisk}
          </div>

          <div className="bg-green-100 p-4 rounded-xl">
            Graduated {summary.graduated}
          </div>

        </div>

        {/* PLO */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3>PLO (Graduated: {plo.count})</h3>
          <PLOChart plos={plo.plos} />
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <input
            placeholder="Search"
            className="p-3 border rounded-xl flex-1"
            onChange={e => setSearch(e.target.value)}
          />

         <select

  value={statusFilter}

  onChange={e =>
    setStatusFilter(
      e.target.value
    )
  }

  className="
    p-3 border rounded-xl
    bg-white
    min-w-[220px]
    font-medium
  "
>

  <option value="ALL">
    All Students
  </option>

  <option value="AT_RISK">
    At Risk
  </option>

  <option value="SLIGHTLY_DELAYED">
    Slightly Delayed
  </option>

  <option value="ON_TRACK">
    On Track
  </option>

  <option value="GRADUATED">
    Graduated
  </option>

</select>

</div>
        {/* Table */}
        <table className="w-full border mt-4">

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
        px-6 py-4 text-left
        text-xs font-bold
        uppercase tracking-wider
        text-gray-700
      "
    >
      Student Name
    </th>

    <th
      className="
        px-6 py-4 text-left
        text-xs font-bold
        uppercase tracking-wider
        text-gray-700
      "
    >
      Matric
    </th>

    <th
      className="
        px-6 py-4 text-left
        text-xs font-bold
        uppercase tracking-wider
        text-gray-700
      "
    >
      Status
    </th>

    <th
      className="
        px-6 py-4 text-center
        text-xs font-bold
        uppercase tracking-wider
        text-gray-700
      "
    >
      Profile
    </th>

  </tr>

</thead>          
        <tbody className="divide-y divide-gray-100">

  {filtered.map((s, i) => (

    <tr
      key={i}
      className="
        hover:bg-purple-50/40
        transition
      "
    >

      <td
        className="
          px-6 py-4
          font-medium
          text-gray-800
        "
      >
        {s.name}
      </td>

      <td
        className="
          px-6 py-4
          text-gray-600
        "
      >
        {s.matric}
      </td>

      <td className="px-6 py-4">

        <span
          className={`
            px-3 py-1 rounded-full
            text-xs font-semibold

            ${
              s.overallStatus ===
              "AT_RISK"

                ? "bg-red-100 text-red-700"

              : s.overallStatus ===
                "SLIGHTLY_DELAYED"

                ? "bg-yellow-100 text-yellow-700"

              : s.overallStatus ===
                "ON_TRACK"

                ? "bg-green-100 text-green-700"

              : "bg-blue-100 text-blue-700"
            }
          `}
        >
          {s.overallStatus
            ?.replaceAll("_", " ")}
        </span>

      </td>

      <td
        className="
          px-6 py-4 text-center
        "
      >

        <Link
          href={`/admin/student/${encodeURIComponent(
            s.email
          )}`}
          className="
            text-purple-600
            font-semibold
            hover:underline
          "
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
  );
}
