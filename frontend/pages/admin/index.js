// ==========================================
// frontend/pages/admin/index.jsx
// ==========================================

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
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
        "bg-blue-100 text-blue-700"
    },

    SLIGHTLY_DELAYED: {
      label: "Slightly Delayed",
      className:
        "bg-yellow-100 text-yellow-700"
    },

    AT_RISK: {
      label: "At Risk",
      className:
        "bg-red-100 text-red-700"
    },

    GRADUATED: {
      label: "Graduated",
      className:
        "bg-green-100 text-green-700"
    },
  };

  const item =
    config[normalized] || {

      label: normalized,

      className:
        "bg-gray-100 text-gray-700"
    };

  return (
    <span
      className={`
        px-3 py-1 rounded-full
        text-xs font-semibold
        ${item.className}
      `}
    >
      {item.label}
    </span>
  );
}

/* ==========================================
   PAGE
========================================== */
export default function AdminDashboard() {

  const router = useRouter();

  /* ======================
     STATE
  ====================== */
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

  /* ======================
     LOGOUT
  ====================== */
  function handleLogout() {

    localStorage.clear();

    router.push("/login");
  }

  /* ======================
     AUTH GUARD
  ====================== */
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

  /* ======================
     LOAD PROGRAMMES
  ====================== */
  useEffect(() => {

    if (!checked) return;

    apiGet("/api/admin/programmes/students")

      .then(d =>
        setProgrammes(
          d.programmes || []
        )
      )

      .catch(() =>
        setProgrammes([])
      );

  }, [checked]);

  /* ======================
     LOAD PROGRAMME DATA
  ====================== */
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

  /* ======================
     FILTER STUDENTS
  ====================== */
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
          ?.toUpperCase() ===
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

  /* ======================
     LOADING
  ====================== */
  if (!checked) {

    return (
      <div className="p-6">
        Checking access…
      </div>
    );
  }

  /* ======================
     PAGE
  ====================== */
  return (

    <div
      className="
        max-w-7xl mx-auto
        p-6 space-y-6
      "
    >

      {/* HEADER */}
      <div
        className="
          flex justify-between
          items-center
        "
      >

        <h1
          className="
            text-2xl font-bold
            text-purple-700
          "
        >
          Admin Dashboard
        </h1>

        <div className="flex gap-3">

          <button
            onClick={() =>
              router.push("/")
            }

            className="
              text-purple-600
              underline text-sm
            "
          >
            ← Landing Page
          </button>

          <button
            onClick={handleLogout}

            className="
              bg-red-600 text-white
              px-4 py-2 rounded-xl
              font-semibold
            "
          >
            Logout
          </button>
        </div>
      </div>

      {/* PROGRAMME */}
      <select

        className="
          w-full p-3
          border rounded-xl
        "

        value={programme}

        onChange={e =>
          setProgramme(
            e.target.value
          )
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

      {/* LOADING */}
      {loading && (

        <div className="text-gray-500">
          Loading…
        </div>
      )}

      {/* SUMMARY */}
      <div
        className="
          grid grid-cols-1
          md:grid-cols-4 gap-4
        "
      >

        {/* ON TRACK */}
        <div
          className="
            bg-blue-100
            p-4 rounded-2xl
          "
        >

          <div
            className="
              text-sm font-semibold
            "
          >
            On Track
          </div>

          <div
            className="
              text-3xl font-bold
            "
          >
            {summary.onTrack}
          </div>
        </div>

        {/* SLIGHTLY DELAYED */}
        <div
          className="
            bg-yellow-100
            p-4 rounded-2xl
          "
        >

          <div
            className="
              text-sm font-semibold
            "
          >
            Slightly Delayed
          </div>

          <div
            className="
              text-3xl font-bold
            "
          >
            {summary.slightlyDelayed}
          </div>
        </div>

        {/* AT RISK */}
        <div
          className="
            bg-red-100
            p-4 rounded-2xl
          "
        >

          <div
            className="
              text-sm font-semibold
            "
          >
            At Risk
          </div>

          <div
            className="
              text-3xl font-bold
            "
          >
            {summary.atRisk}
          </div>
        </div>

        {/* GRADUATED */}
        <div
          className="
            bg-green-100
            p-4 rounded-2xl
          "
        >

          <div
            className="
              text-sm font-semibold
            "
          >
            Graduated
          </div>

          <div
            className="
              text-3xl font-bold
            "
          >
            {summary.graduated}
          </div>
        </div>
      </div>

      {/* CQI */}
      {cqi && (

        <div
          className="
            bg-white p-6
            rounded-2xl shadow
          "
        >

          <h3
            className="
              font-semibold mb-1
            "
          >
            Final Programme
            PLO Achievement
          </h3>

          <p
            className="
              text-xs text-gray-500
              mb-4
            "
          >
            Based on
            {" "}
            {cqi.graduates}
            {" "}
            graduated student(s)
          </p>

          {Object.entries(
            cqi.plo
          ).map(([plo, v]) => (

            <div
              key={plo}
              className="mb-3"
            >

              <div
                className="
                  flex justify-between
                  text-sm
                "
              >

                <span>{plo}</span>

                <span>
                  {v.percent !== null
                    ? `${v.percent}%`
                    : "-"
                  }
                </span>
              </div>

              <div
                className="
                  w-full h-2
                  bg-gray-200 rounded
                "
              >

                <div

                  className={`
                    h-2 rounded

                    ${
                      v.status ===
                      "Achieved"

                        ? "bg-green-500"

                        : v.status ===
                          "Borderline"

                        ? "bg-yellow-400"

                        : "bg-red-500"
                    }
                  `}

                  style={{
                    width:
                      `${v.percent || 0}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SEARCH + FILTER */}
      <div
        className="
          flex flex-col
          md:flex-row gap-4
        "
      >

        <input

          type="text"

          placeholder="
            Search by name or matric…
          "

          className="
            flex-1 p-3 border
            rounded-xl
          "

          value={search}

          onChange={e =>
            setSearch(
              e.target.value
            )
          }
        />

        <select

          className="
            p-3 border rounded-xl
            w-full md:w-64
          "

          value={statusFilter}

          onChange={e =>
            setStatusFilter(
              e.target.value
            )
          }
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

      {/* STUDENT TABLE */}
      <div
        className="
          bg-white rounded-2xl
          shadow overflow-hidden
        "
      >

        <div
          className="
            px-6 py-4 border-b
          "
        >

          <h3 className="font-semibold">
            Student List
          </h3>

          <p
            className="
              text-xs text-gray-500
            "
          >
            Showing
            {" "}
            {students.length}
            {" "}
            student(s)
          </p>
        </div>

        <table
          className="
            w-full text-sm
          "
        >

          <thead
            className="
              bg-gray-100 border-b
            "
          >

            <tr>

              <th
                className="
                  px-6 py-3 text-left
                  text-xs font-semibold
                "
              >
                Name
              </th>

              <th
                className="
                  px-6 py-3 text-left
                  text-xs font-semibold
                "
              >
                Matric
              </th>

              <th
                className="
                  px-6 py-3 text-left
                  text-xs font-semibold
                "
              >
                Status
              </th>

              <th
                className="
                  px-6 py-3 text-center
                  text-xs font-semibold
                "
              >
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

                <td
                  className="
                    px-6 py-4
                  "
                >
                  {s.name}
                </td>

                <td
                  className="
                    px-6 py-4
                  "
                >
                  {s.matric}
                </td>

                <td
                  className="
                    px-6 py-4
                  "
                >
                  <StatusBadge
                    status={s.status}
                  />
                </td>

                <td
                  className="
                    px-6 py-4 text-center
                  "
                >

                  <Link

                    href={`/admin/student/${encodeURIComponent(
                      s.email
                        .trim()
                        .toLowerCase()
                    )}`}

                    className="
                      text-purple-600
                      font-medium
                      hover:underline
                    "
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}

            {!students.length && (

              <tr>

                <td

                  colSpan={4}

                  className="
                    px-6 py-6
                    text-center text-gray-500
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
  );
}
