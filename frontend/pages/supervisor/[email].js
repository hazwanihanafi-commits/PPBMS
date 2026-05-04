// ==========================================
// frontend/pages/supervisor/[email].jsx
// MODERN STUDENT DASHBOARD UI
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
   STATUS COLOR
========================================== */
function getRiskColor(risk) {
  if (risk === "HIGH RISK") {
    return "bg-red-500";
  }

  if (risk === "MODERATE RISK") {
    return "bg-orange-500";
  }

  return "bg-green-500";
}

/* ==========================================
   CARD
========================================== */
function Card({ children }) {
  return (
    <div
      className="
        bg-white rounded-3xl
        border border-gray-100
        shadow-sm p-6
      "
    >
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
    <div
      className="
        bg-white rounded-3xl
        border border-gray-100
        shadow-sm p-5
      "
    >
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h2
            className="
              text-4xl font-bold
              mt-2
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
   PAGE
========================================== */
export default function SupervisorStudentPage() {
  const router = useRouter();

  const { email } = router.query;

  const [student, setStudent] =
    useState(null);

  const [timeline, setTimeline] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

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

      setStudent(studentData);

      setTimeline(
        studentData.timeline || []
      );
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  /* ==========================================
     LOADING
  ========================================== */
  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        Student not found
      </div>
    );
  }

  /* ==========================================
     DATA
  ========================================== */
  const completed = timeline.filter(
    (t) =>
      t.status
        ?.toLowerCase()
        .trim() === "completed"
  ).length;

  const progress =
    timeline.length > 0
      ? Math.round(
          (completed /
            timeline.length) *
            100
        )
      : 0;

  const delayed = timeline.filter(
    (t) =>
      t.status
        ?.toLowerCase()
        .trim() === "due soon"
  ).length;

  const atRisk = timeline.filter(
    (t) =>
      t.status
        ?.toLowerCase()
        .trim() === "late"
  ).length;

  const risk =
    atRisk >= 3
      ? "HIGH RISK"
      : atRisk > 0 ||
        delayed > 2
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
      name: "In Progress",
      value: delayed,
      color: "#F59E0B",
    },

    {
      name: "Not Started",
      value:
        timeline.length -
        completed -
        delayed,
      color: "#CBD5E1",
    },
  ];

  const barData = [
    {
      name: "On Track",
      students: completed,
    },

    {
      name: "Delayed",
      students: delayed,
    },

    {
      name: "At Risk",
      students: atRisk,
    },
  ];

  /* ==========================================
     UI
  ========================================== */
  return (
    <div
      className="
        min-h-screen
        bg-slate-100
        flex
      "
    >
      {/* SIDEBAR */}
      <aside
        className="
          w-64 bg-gradient-to-b
          from-slate-900 to-slate-800
          text-white p-5
          hidden lg:block
        "
      >
        <h1
          className="
            text-3xl font-bold mb-8
          "
        >
          PPBMS
        </h1>

        <div className="space-y-2">
          <SidebarItem
            icon={
              <LayoutDashboard
                size={18}
              />
            }
            label="Dashboard"
            active
          />

          <SidebarItem
            icon={<BarChart3 size={18} />}
            label="My Progress"
          />

          <SidebarItem
            icon={
              <ClipboardList
                size={18}
              />
            }
            label="Milestones"
          />

          <SidebarItem
            icon={<FileText size={18} />}
            label="Documents"
          />

          <SidebarItem
            icon={<Bell size={18} />}
            label="Notifications"
          />
        </div>
      </aside>

      {/* MAIN */}
      <main
        className="
          flex-1 p-6 space-y-6
        "
      >
        {/* HEADER */}
        <div
          className="
            bg-[#b48a85]
            rounded-3xl
            px-6 py-4
            text-white
          "
        >
          <h1
            className="
              text-4xl font-bold
            "
          >
            SYSTEM HIGHLIGHTS
          </h1>
        </div>

        {/* DASHBOARD */}
        <div
          className="
            bg-white rounded-3xl
            p-6 border shadow-sm
          "
        >
          <h2
            className="
              text-2xl font-bold
              mb-6
            "
          >
            My Progress Overview
          </h2>

          {/* SUMMARY */}
          <div
            className="
              grid grid-cols-1
              md:grid-cols-4 gap-4
              mb-6
            "
          >
            <SummaryCard
              title="Milestones Completed"
              value={`${completed}/${timeline.length}`}
              color="bg-blue-100"
              icon={
                <CheckCircle2
                  className="
                    text-blue-600
                  "
                />
              }
            />

            <SummaryCard
              title="On Track"
              value={completed}
              color="bg-green-100"
              icon={
                <GraduationCap
                  className="
                    text-green-600
                  "
                />
              }
            />

            <SummaryCard
              title="Slightly Delayed"
              value={delayed}
              color="bg-orange-100"
              icon={
                <Clock3
                  className="
                    text-orange-600
                  "
                />
              }
            />

            <SummaryCard
              title="At Risk"
              value={atRisk}
              color="bg-red-100"
              icon={
                <AlertTriangle
                  className="
                    text-red-600
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
            <Card>
              <h3
                className="
                  font-bold mb-4
                "
              >
                Milestone Progress
              </h3>

              <div className="h-72">
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

              <div className="text-center mt-2">
                <span
                  className="
                    text-3xl font-bold
                  "
                >
                  {progress}%
                </span>
              </div>
            </Card>

            {/* BAR */}
            <Card>
              <h3
                className="
                  font-bold mb-4
                "
              >
                Students by Status
              </h3>

              <div className="h-72">
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
        </div>

        {/* TIMELINE */}
        <Card>
          <h3
            className="
              text-xl font-bold
              mb-8
            "
          >
            Milestone Timeline
          </h3>

          <div className="flex justify-between">
            {timeline.map((t, i) => {
              const done =
                t.status
                  ?.toLowerCase()
                  .trim() ===
                "completed";

              const soon =
                t.status
                  ?.toLowerCase()
                  .trim() ===
                "due soon";

              return (
                <div
                  key={i}
                  className="
                    flex-1 flex flex-col
                    items-center relative
                  "
                >
                  {i !==
                    timeline.length -
                      1 && (
                    <div
                      className="
                        absolute top-4 left-1/2
                        w-full h-1 bg-gray-300
                      "
                    />
                  )}

                  <div
                    className={`
                      w-8 h-8 rounded-full
                      z-10 relative
                      flex items-center
                      justify-center text-white

                      ${
                        done
                          ? "bg-green-500"

                          : soon
                          ? "bg-orange-500"

                          : "bg-gray-400"
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
                    {t.activity}
                  </p>

                  <span
                    className="
                      text-[10px]
                      text-gray-500
                    "
                  >
                    {t.status}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* STUDENT INFO */}
        <Card>
          <h3
            className="
              text-xl font-bold
              mb-4
            "
          >
            Student Information
          </h3>

          <div
            className="
              grid grid-cols-1
              md:grid-cols-2 gap-4
            "
          >
            <InfoItem
              label="Name"
              value={
                student.student_name
              }
            />

            <InfoItem
              label="Programme"
              value={student.programme}
            />

            <InfoItem
              label="Email"
              value={student.email}
            />

            <InfoItem
              label="Risk Level"
              value={risk}
            />
          </div>
        </Card>
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
}) {
  return (
    <button
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
    <div
      className="
        bg-slate-50 rounded-2xl
        p-4 border
      "
    >
      <p
        className="
          text-xs text-gray-500
          mb-1
        "
      >
        {label}
      </p>

      <p className="font-semibold">
        {value || "-"}
      </p>
    </div>
  );
}
