// ==========================================
// frontend/pages/supervisor/[email].jsx
// ULTIMATE FINAL VERSION
// FIXED:
// ✅ Graduated logic
// ✅ Documents display
// ✅ Remarks display
// ✅ Timeline colors
// ✅ Milestone totals
// ✅ Safe arrays
// ✅ Backend/frontend tally
// ==========================================

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Bell,
  BarChart3,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  GraduationCap,
  ArrowLeft,
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

/* ==========================================
   CARD
========================================== */
function Card({ children }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
      {children}
    </div>
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
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h2 className="text-4xl font-bold mt-2">
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
            ? "bg-white/10 text-white"
            : "text-slate-300 hover:bg-white/5"
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}

/* ==========================================
   INFO ITEM
========================================== */
function InfoItem({
  label,
  value,
}) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4 border">
      <p className="text-xs text-gray-500 mb-1">
        {label}
      </p>

      <p className="font-semibold">
        {value || "-"}
      </p>
    </div>
  );
}

/* ==========================================
   PAGE
========================================== */
export default function SupervisorStudentPage() {
  const router = useRouter();

  const { email } = router.query;

  const [student, setStudent] =
    useState(null);

  const [timeline, setTimeline] =
    useState([]);

  const [documents, setDocuments] =
    useState([]);

  const [remarks, setRemarks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [activeMenu, setActiveMenu] =
    useState("dashboard");

  /* ==========================================
     LOAD
  ========================================== */
  useEffect(() => {
    if (!email) return;

    loadStudent();
  }, [email]);

  async function loadStudent() {
    try {
      const token =
        localStorage.getItem(
          "ppbms_token"
        );

      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${encodeURIComponent(
          email
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await res.json();

      const studentData =
        data.row ||
        data.student ||
        data;

      console.log(
        "FULL STUDENT DATA:",
        studentData
      );

      setStudent(studentData);

      /* TIMELINE */
      setTimeline(
        Array.isArray(
          studentData.timeline
        )
          ? studentData.timeline
          : []
      );

      /* DOCUMENTS */
      const docsObject =
        studentData.documents || {};

      const docsArray =
        Object.entries(
          docsObject
        )
          .map(([name, value]) => ({
            name,
            ...value,
          }))
          .filter(d => d.url);

      setDocuments(docsArray);

      /* REMARKS */
      setRemarks(
        Array.isArray(
          studentData.remarksByAssessment
        )
          ? studentData.remarksByAssessment
          : []
      );

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }
  }

  /* ==========================================
     LOADING
  ========================================== */
  if (loading) {
    return (
      <div className="p-10">
        Loading dashboard...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-10">
        Student not found
      </div>
    );
  }

  /* ==========================================
     GRADUATED
  ========================================== */
  const statusText =
    (
      student.status || ""
    ).toUpperCase();

  const graduated =
    statusText.includes(
      "GRADUATED"
    ) ||
    statusText.includes(
      "COMPLETED"
    ) ||
    statusText.includes(
      "FINAL"
    );

  /* ==========================================
     COUNTS
  ========================================== */
  const completed = (
    Array.isArray(timeline)
      ? timeline
      : []
  ).filter(t =>
    (
      t.status || ""
    )
      .toUpperCase()
      .includes("COMPLETED")
  ).length;

  const delayed = (
    Array.isArray(timeline)
      ? timeline
      : []
  ).filter(t =>
    (
      t.status || ""
    )
      .toUpperCase()
      .includes("PENDING")
  ).length;

  const atRisk = (
    Array.isArray(timeline)
      ? timeline
      : []
  ).filter(t =>
    (
      t.status || ""
    )
      .toUpperCase()
      .includes("AT_RISK")
  ).length;

  const progress = graduated
    ? 100
    : timeline.length > 0
    ? Math.round(
        (
          completed /
          timeline.length
        ) * 100
      )
    : 0;

  const risk = graduated
    ? "GRADUATED"
    : atRisk >= 3
    ? "HIGH RISK"
    : atRisk > 0 || delayed > 2
    ? "MODERATE RISK"
    : "LOW RISK";

  /* ==========================================
     CHARTS
  ========================================== */
  const pieData = [
    {
      name: "Completed",
      value: completed,
      color: "#10B981",
    },

    {
      name: "Pending",
      value: delayed,
      color: "#F59E0B",
    },

    {
      name: "At Risk",
      value: atRisk,
      color: "#EF4444",
    },
  ];

  const barData = [
    {
      name: "Completed",
      students: completed,
    },

    {
      name: "Pending",
      students: delayed,
    },

    {
      name: "At Risk",
      students: atRisk,
    },
  ];

  /* ==========================================
     RETURN
  ========================================== */
  return (
    <div className="min-h-screen flex bg-slate-100">

      {/* SIDEBAR */}
      <aside className="w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 hidden lg:flex flex-col">

        <div className="mb-10">

          <h1 className="text-3xl font-bold">
            PPBMS
          </h1>

          <p className="text-slate-300 text-sm mt-1">
            Supervisor Portal
          </p>

        </div>

        <div className="space-y-2">

  <SidebarItem
    icon={
      <LayoutDashboard size={18} />
    }
    label="Dashboard"
    active={
      activeMenu ===
      "dashboard"
    }
    onClick={() =>
      setActiveMenu(
        "dashboard"
      )
    }
  />

  <SidebarItem
    icon={<BarChart3 size={18} />}
    label="Progress"
    active={
      activeMenu ===
      "progress"
    }
    onClick={() =>
      setActiveMenu(
        "progress"
      )
    }
  />

  <SidebarItem
    icon={
      <ClipboardList size={18} />
    }
    label="Milestones"
    active={
      activeMenu ===
      "milestones"
    }
    onClick={() =>
      setActiveMenu(
        "milestones"
      )
    }
  />

  <SidebarItem
    icon={<FileText size={18} />}
    label="Documents"
    active={
      activeMenu ===
      "documents"
    }
    onClick={() =>
      setActiveMenu(
        "documents"
      )
    }
  />

  <SidebarItem
    icon={<Bell size={18} />}
    label="Remarks"
    active={
      activeMenu ===
      "remarks"
    }
    onClick={() =>
      setActiveMenu(
        "remarks"
      )
    }
  />

  <SidebarItem
    icon={
      <AlertTriangle size={18} />
    }
    label="CQI"
    active={
      activeMenu === "cqi"
    }
    onClick={() =>
      setActiveMenu("cqi")
    }
  />

</div>

        <div className="mt-auto">

          <button
            onClick={() =>
              router.back()
            }
            className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 transition p-3 rounded-2xl"
          >
            <ArrowLeft size={18} />
            Back
          </button>

        </div>

      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-auto">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl px-8 py-8 text-white">

          <h1 className="text-4xl font-bold">
            Student Monitoring Dashboard
          </h1>

          <p className="mt-2 text-purple-100">
            Track postgraduate progress,
            milestones and supervision analytics
          </p>

        </div>

        {/* DASHBOARD */}
        {activeMenu === "dashboard" && (

          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

              <SummaryCard
                title="Completed"
                value={`${completed}/${timeline.length}`}
                color="bg-green-100"
                icon={
                  <CheckCircle2 className="text-green-600" />
                }
              />

              {!graduated && (
                <SummaryCard
                  title="Progress"
                  value={`${progress}%`}
                  color="bg-blue-100"
                  icon={
                    <GraduationCap className="text-blue-600" />
                  }
                />
              )}

              {!graduated && (
                <SummaryCard
                  title="Pending"
                  value={delayed}
                  color="bg-orange-100"
                  icon={
                    <Clock3 className="text-orange-600" />
                  }
                />
              )}

              <SummaryCard
                title="Status"
                value={
                  graduated
                    ? "GRADUATED"
                    : risk
                }
                color="bg-red-100"
                icon={
                  <AlertTriangle className="text-red-600" />
                }
              />

            </div>

            {/* CHARTS */}
            {!graduated && (

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <Card>

                  <h3 className="font-bold mb-4">
                    Milestone Progress
                  </h3>

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
                            (
                              entry,
                              index
                            ) => (
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

                </Card>

                <Card>

                  <h3 className="font-bold mb-4">
                    Risk Analytics
                  </h3>

                  <div className="h-80">

                    <ResponsiveContainer>

                      <BarChart
                        data={barData}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                        />

                        <XAxis dataKey="name" />

                        <YAxis />

                        <Tooltip />

                        <Bar
                          dataKey="students"
                          fill="#7C3AED"
                          radius={[
                            10, 10, 0, 0,
                          ]}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  </div>

                </Card>

              </div>
            )}

            {/* INFO */}
            <Card>

              <h3 className="text-2xl font-bold mb-6">
                Student Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                <InfoItem
                  label="Name"
                  value={
                    student.student_name
                  }
                />

                <InfoItem
                  label="Programme"
                  value={
                    student.programme
                  }
                />

                <InfoItem
                  label="Email"
                  value={
                    student.email
                  }
                />

                <InfoItem
                  label="Status"
                  value={
                    student.status
                  }
                />

              </div>

            </Card>

          </>
        )}

     {/* PROGRESS */}
{activeMenu === "progress" && (

  <Card>

    <h3 className="text-2xl font-bold mb-6">
      Progress Summary
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

      <SummaryCard
        title="Completed"
        value={completed}
        color="bg-green-100"
        icon={
          <CheckCircle2 className="text-green-600" />
        }
      />

      <SummaryCard
        title="Pending"
        value={delayed}
        color="bg-orange-100"
        icon={
          <Clock3 className="text-orange-600" />
        }
      />

      {!graduated && (

        <SummaryCard
          title="At Risk"
          value={atRisk}
          color="bg-red-100"
          icon={
            <AlertTriangle className="text-red-600" />
          }
        />

      )}

    </div>

  </Card>

)}

        {/* MILESTONES */}
        {activeMenu === "milestones" && (

  <Card>

    <h3 className="text-2xl font-bold mb-8">
      Milestone Timeline
      ({timeline.length} Total)
    </h3>

    <div className="space-y-6">

      {(Array.isArray(timeline)
        ? timeline
        : []
      ).map((t, i) => {

        const s =
          (
            t.status || ""
          ).toUpperCase();

        const done =
          s.includes("COMPLETED");

        const riskStatus =
          s.includes("AT_RISK");

        const pending =
          s.includes("PENDING");
        const approved =
  s.includes("APPROVED");

        return (

          <div
            key={i}
            className="
              flex gap-4
              items-start
            "
          >

            {/* ICON */}
            <div
              className={`
                w-10 h-10 rounded-full
                flex items-center
                justify-center text-white
                shrink-0

                ${
                  done
                    ? "bg-green-500"

                    : riskStatus
                    ? "bg-red-500"
                  : approved
  ? "bg-blue-500"
  : pending
  ? "bg-orange-500"
  : "bg-gray-400"
                }
              `}
            >
              ✓
            </div>

            {/* CONTENT */}
            <div
              className="
                flex-1 border rounded-2xl
                p-4 bg-slate-50
              "
            >

              <div className="
                flex justify-between
                items-center
              ">

                <h4 className="font-bold">
                  {t.activity}
                </h4>

                <span
                  className="
                    text-xs uppercase
                    px-3 py-1 rounded-full
                    bg-white border
                  "
                >
                  {t.status}
                </span>

              </div>

            </div>

          </div>
        );
      })}

    </div>

  </Card>
)}

{/* DOCUMENTS */}
{activeMenu === "documents" && (

  <Card>

    <div className="flex items-center justify-between mb-6">

      <h3 className="text-2xl font-bold">
        Uploaded Documents
      </h3>

      <div className="
        px-4 py-2 rounded-xl
        bg-purple-100 text-purple-700
        text-sm font-semibold
      ">
        {documents.length} Documents
      </div>

    </div>

    {!documents.length && (
      <p className="text-gray-500">
        No documents uploaded yet.
      </p>
    )}

    <div className="space-y-5">

      {documents.map((doc, i) => (

        <div
          key={i}
          className="
            border rounded-3xl p-5
            bg-white shadow-sm
          "
        >

          {/* TOP */}
          <div className="
            flex flex-col xl:flex-row
xl:items-center
xl:justify-between
            gap-4
          ">

            {/* LEFT */}
            <div>

              <p className="
                font-bold text-lg
              ">
                {doc.name}
              </p>

              <p className="
                text-sm text-gray-500 mt-1
              ">
                Status:
                <span className="
                  ml-2 font-medium
                ">
                  {doc.status}
                </span>
              </p>

            </div>

            {/* ACTIONS */}
            <div className="
              flex flex-wrap gap-2
              overflow-x-auto
            ">

              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="
                  px-4 py-2 rounded-xl
                  bg-purple-100
                  text-purple-700
                  font-medium
                "
              >
                View
              </a>

              <button
                className="
                  px-4 py-2 rounded-xl
                  bg-green-100
                  text-green-700
                  font-medium
                "
              >
                Approve
              </button>

              <button
                className="
                  px-4 py-2 rounded-xl
                  bg-orange-100
                  text-orange-700
                  font-medium
                "
              >
                Revise
              </button>

            </div>

          </div>

          {/* FEEDBACK */}
          <div className="mt-5">

            <label className="
              text-sm font-semibold
              text-gray-700
            ">
              Supervisor Feedback
            </label>

            <textarea
              placeholder="
Add feedback or revision comments...
              "
              className="
                mt-2 w-full border
                rounded-2xl p-4
                min-h-[120px]
                focus:outline-none
                focus:ring-2
                focus:ring-purple-500
              "
              defaultValue={
                doc.feedback || ""
              }
            />

            <div className="
              flex justify-end mt-4
            ">

              <button
                className="
                  px-5 py-3 rounded-2xl
                  bg-purple-600
                  hover:bg-purple-700
                  text-white font-semibold
                  transition
                "
              >
                Save Feedback
              </button>

            </div>

          </div>

        </div>
      ))}

    </div>

  </Card>
)}


{/* REMARKS */}
{activeMenu === "remarks" && (

  <Card>

    <div className="
      flex items-center justify-between
      mb-6
    ">

      <h3 className="text-2xl font-bold">
        Supervisor Remarks
      </h3>

      <div className="
        px-4 py-2 rounded-xl
        bg-purple-100 text-purple-700
        text-sm font-semibold
      ">
        {remarks.length} Remarks
      </div>

    </div>

    {/* ADD REMARK */}
    <div className="
      border rounded-3xl
      p-5 mb-8 bg-slate-50
    ">

      <h4 className="
        text-lg font-bold mb-4
      ">
        Add New Remark
      </h4>

      <div className="
        grid grid-cols-1 md:grid-cols-2
        gap-4 mb-4
      ">

        <input
          type="text"
          placeholder="Assessment Type"
          className="
            border rounded-2xl
            p-3
          "
        />

        <input
          type="text"
          placeholder="Assessment Instance"
          className="
            border rounded-2xl
            p-3
          "
        />

      </div>

      <textarea
        placeholder="
Enter supervisor remark here...
        "
        className="
          w-full border rounded-2xl
          p-4 min-h-[140px]
          focus:outline-none
          focus:ring-2
          focus:ring-purple-500
        "
      />

      <div className="
        flex justify-end mt-4
      ">

        <button
          className="
            px-6 py-3 rounded-2xl
            bg-purple-600
            hover:bg-purple-700
            text-white font-semibold
            transition
          "
        >
          Save Remark
        </button>

      </div>

    </div>

    {/* REMARK LIST */}
    {!remarks.length && (
      <p className="text-gray-500">
        No remarks available.
      </p>
    )}

    <div className="space-y-5">

      {remarks.map((r, i) => (

        <div
          key={i}
          className="
            border rounded-3xl
            p-5 bg-white
            shadow-sm
          "
        >

          <div className="
            flex flex-col lg:flex-row
            lg:items-center
            lg:justify-between
            gap-3 mb-3
          ">

            <div>

              <p className="
                font-bold text-lg
              ">
                {r.assessmentType ||
                  "Assessment"}
              </p>

              <p className="
                text-sm text-gray-500
              ">
                {r.assessmentInstance ||
                  "-"}
              </p>

            </div>

            <div className="
              flex gap-2
            ">

              <button
                className="
                  px-4 py-2 rounded-xl
                  bg-blue-100
                  text-blue-700
                  font-medium
                "
              >
                Edit
              </button>

              <button
                className="
                  px-4 py-2 rounded-xl
                  bg-red-100
                  text-red-700
                  font-medium
                "
              >
                Delete
              </button>

            </div>

          </div>

          <div className="
            bg-slate-50 rounded-2xl
            p-4
          ">

            <p className="
              text-gray-700
              whitespace-pre-wrap
            ">
              {r.remark || "-"}
            </p>

          </div>

        </div>
      ))}

    </div>

  </Card>
)}

  {/* CQI */}
{activeMenu === "cqi" && (

  <Card>

    <h3 className="
      text-2xl font-bold
      mb-6
    ">
      CQI & Intervention
    </h3>

    <div className="
      border rounded-3xl
      p-5 bg-slate-50
    ">

      <textarea
        placeholder="
Add CQI intervention notes...
        "
       className="
  w-full border rounded-2xl
  p-4 min-h-[150px]
  focus:outline-none
  focus:ring-2
  focus:ring-purple-500
"
      />

      <div className="
        flex justify-end mt-4
      ">

        <button
          className="
            px-6 py-3 rounded-2xl
            bg-purple-600 text-white
          "
        >
          Save CQI
        </button>

      </div>

    </div>

  </Card>
)}
      </main>

    </div>
  );
}
