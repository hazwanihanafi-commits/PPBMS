// ===============================
// frontend/pages/admin/index.jsx
// ===============================

import { useEffect, useState, useMemo } from "react";

import { useRouter } from "next/router";

import Link from "next/link";

import { apiGet } from "@/utils/api";

/* ================= STATUS BADGE ================= */
function StatusBadge({ status }) {

  const normalized = status
    ?.toString()
    .replaceAll("_", " ")
    .toUpperCase();

  const map = {

    "ON TRACK":
      "bg-blue-100 text-blue-700",

    "SLIGHTLY DELAYED":
      "bg-yellow-100 text-yellow-700",

    "AT RISK":
      "bg-red-100 text-red-700",

    GRADUATED:
      "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`
        px-2 py-1 rounded text-xs font-semibold
        ${map[normalized] ||
          "bg-gray-100 text-gray-700"}
      `}
    >
      {normalized}
    </span>
  );
}

/* ================= PAGE ================= */
export default function AdminDashboard() {

  const router = useRouter();

  const [checked, setChecked] =
    useState(false);

  const [programmes, setProgrammes] =
    useState([]);

  const [programme, setProgramme] =
    useState("");

  const [cqi, setCQI] =
    useState(null);

  const [graduates, setGraduates] =
    useState([]);

  const [
    activeStudents,
    setActiveStudents
  ] = useState([]);

  const [summary, setSummary] =
    useState({

      onTrack: 0,
      slightlyDelayed: 0,
      atRisk: 0,
      graduated: 0,
    });

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter
  ] = useState("ALL");

  /* ================= AUTH ================= */
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

  /* ================= PROGRAMMES ================= */
  useEffect(() => {

    if (!checked) return;

    apiGet("/api/admin/programmes/students")

      .then(d =>
        setProgrammes(d.programmes || [])
      )

      .catch(() =>
        setProgrammes([])
      );

  }, [checked]);

  /* ================= LOAD DATA ================= */
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

      .then(([plo, grad, active, sum]) => {

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
      })

      .finally(() =>
        setLoading(false)
      );

  }, [programme]);

  /* ================= FILTER ================= */
  const students = useMemo(() => {

    const all = [
      ...activeStudents,
      ...graduates
    ];

    return all.filter(s => {

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

        s.status
          ?.toUpperCase()
          .replaceAll("_", " ") ===
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
    graduates
  ]);

  if (!checked) {
    return (
      <div className="p-6">
        Checking access…
      </div>
    );
  }

  return (
    <div className="
      max-w-7xl mx-auto
      p-6 space-y-6
    ">

      {/* HEADER */}
      <div className="
        flex justify-between items-center
      ">

        <h1 className="
          text-2xl font-bold text-purple-700
        ">
          Admin Dashboard
        </h1>

        <button
          onClick={() => {

            localStorage.clear();

            router.push("/login");
          }}

          className="
            bg-red-600 text-white
            px-4 py-2 rounded-xl
            font-semibold
          "
        >
          Logout
        </button>
      </div>

      {/* PROGRAMME */}
      <select
        className="
          w-full p-3 border rounded
        "

        value={programme}

        onChange={e =>
          setProgramme(e.target.value)
        }
      >

        <option value="">
          Select Programme
        </option>

        {programmes.map(p => (

          <option
            key={p}
            value={p}
          >
            {p}
          </option>
        ))}
      </select>

      {loading && (
        <div className="text-gray-500">
          Loading…
        </div>
      )}

      {/* SUMMARY */}
      <div className="
        grid grid-cols-1
        md:grid-cols-4 gap-4
      ">

        <div className="
          bg-blue-100 p-4 rounded-xl
        ">
          <div className="
            text-sm font-semibold
          ">
            On Track
          </div>

          <div className="
            text-2xl font-bold
          ">
            {summary.onTrack}
          </div>
        </div>

        <div className="
          bg-yellow-100 p-4 rounded-xl
        ">
          <div className="
            text-sm font-semibold
          ">
            Slightly Delayed
          </div>

          <div className="
            text-2xl font-bold
          ">
            {summary.slightlyDelayed}
          </div>
        </div>

        <div className="
          bg-red-100 p-4 rounded-xl
        ">
          <div className="
            text-sm font-semibold
          ">
            At Risk
          </div>

          <div className="
            text-2xl font-bold
          ">
            {summary.atRisk}
          </div>
        </div>

        <div className="
          bg-green-100 p-4 rounded-xl
        ">
          <div className="
            text-sm font-semibold
          ">
            Graduated
          </div>

          <div className="
            text-2xl font-bold
          ">
            {summary.graduated}
          </div>
        </div>
      </div>

      {/* FILTER */}
      <div className="
        flex flex-col md:flex-row gap-4
      ">

        <input
          type="text"

          placeholder="
            Search by name or matric…
          "

          className="
            flex-1 p-3 border rounded
          "

          value={search}

          onChange={e =>
            setSearch(e.target.value)
          }
        />

        <select
          className="
            p-3 border rounded
            w-full md:w-56
          "

          value={statusFilter}

          onChange={e =>
            setStatusFilter(e.target.value)
          }
        >

          <option value="ALL">
            All Status
          </option>

          <option value="ON TRACK">
            On Track
          </option>

          <option value="SLIGHTLY DELAYED">
            Slightly Delayed
          </option>

          <option value="AT RISK">
            At Risk
          </option>

          <option value="GRADUATED">
            Graduated
          </option>
        </select>
      </div>

      {/* TABLE */}
      <div className="
        bg-white rounded-xl
        shadow overflow-hidden
      ">

        <table className="
          w-full text-sm
        ">

          <thead className="
            bg-gray-100 border-b
          ">

            <tr>

              <th className="
                px-6 py-3 text-left
              ">
                Name
              </th>

              <th className="
                px-6 py-3 text-left
              ">
                Matric
              </th>

              <th className="
                px-6 py-3 text-left
              ">
                Status
              </th>

              <th className="
                px-6 py-3 text-center
              ">
                Profile
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">

            {students.map((s, i) => (

              <tr
                key={i}
                className="
                  hover:bg-gray-50
                "
              >

                <td className="
                  px-6 py-4
                ">
                  {s.name}
                </td>

                <td className="
                  px-6 py-4
                ">
                  {s.matric}
                </td>

                <td className="
                  px-6 py-4
                ">
                  <StatusBadge
                    status={s.status}
                  />
                </td>

                <td className="
                  px-6 py-4 text-center
                ">

                  <Link
                    href={`
                      /admin/student/${encodeURIComponent(
                        s.email
                          .trim()
                          .toLowerCase()
                      )}
                    `}
                    className="
                      text-purple-600
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
