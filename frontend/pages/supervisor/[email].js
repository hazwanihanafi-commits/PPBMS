// ==========================================
// frontend/pages/supervisor/[email].jsx
// FINAL MODERN SUPERVISOR STUDENT DASHBOARD
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

      setStudent(studentData);

      setTimeline(
        studentData.timeline || []
      );

      setDocuments(
        studentData.documents || []
      );

      setRemarks(
        studentData.remarks || []
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
     DATA
  ========================================== */
  const completed = (
    timeline || []
  ).filter(
    (t) =>
      t.status
        ?.toLowerCase()
        .trim() === "completed"
  ).length;

  const delayed = (
    timeline || []
  ).filter(
    (t) =>
      t.status
        ?.toLowerCase()
        .trim() === "due soon"
  ).length;

  const atRisk = (
    timeline || []
  ).filter(
    (t) =>
      t.status
        ?.toLowerCase()
        .trim() === "late"
  ).length;

  const progress =
    timeline.length > 0
      ? Math.round(
          (completed /
            timeline.length) *
            100
        )
      : 0;

  const risk =
    atRisk >= 3
      ? "HIGH RISK"
      : atRisk > 0 ||
        delayed > 2
      ? "MODERATE RISK"
      : "LOW RISK";

  /* ==========================================
     CHART DATA
  ========================================== */
  const pieData = [
    {
      name: "Completed",
      value: completed,
      color: "#10B981",
    },

    {
      name: "Delayed",
      value: delayed,
      color: "#F59E0B",
    },

    {
      name: "Pending",
      value:
        timeline.length -
        completed -
        delayed,
      color: "#CBD5E1",
    },
  ];

  const barData = [
    {
      name: "Completed",
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
        min-h-screen flex
        bg-slate-100
      "
    >
      {/* SIDEBAR */}
      <aside
        className="
          w-72 bg-gradient-to-b
          from-slate-900 to-slate-800
          text-white p-6
          hidden lg:flex flex-col
        "
      >
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
            label="My Progress"
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

        </div>

        <div className="mt-auto">
          <button
            onClick={() =>
              router.back()
            }
            className="
              w-full flex items-center
              gap-3 bg-white/10
              hover:bg-white/20
              transition p-3 rounded-2xl
            "
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main
        className="
          flex-1 p-6 lg:p-8
          space-y-6 overflow-auto
        "
      >

        {/* HEADER */}
        <div
          className="
            bg-gradient-to-r
            from-purple-600 to-indigo-600
            rounded-3xl
            px-8 py-8 text-white
          "
        >
          <h1 className="text-4xl font-bold">
            Student Monitoring Dashboard
          </h1>

          <p className="mt-2 text-purple-100">
            Track postgraduate progress,
            milestones and supervision
            analytics
          </p>
        </div>

        {/* DASHBOARD */}
        {activeMenu === "dashboard" && (
          <>

            {/* SUMMARY */}
            <div
              className="
                grid grid-cols-1
                md:grid-cols-2
                xl:grid-cols-4 gap-5
              "
            >
              <SummaryCard
                title="Completed"
                value={`${completed}/${timeline.length}`}
                color="bg-green-100"
                icon={
                  <CheckCircle2
                    className="text-green-600"
                  />
                }
              />

              <SummaryCard
                title="Progress"
                value={`${progress}%`}
                color="bg-blue-100"
                icon={
                  <GraduationCap
                    className="text-blue-600"
                  />
                }
              />

              <SummaryCard
                title="Delayed"
                value={delayed}
                color="bg-orange-100"
                icon={
                  <Clock3
                    className="text-orange-600"
                  />
                }
              />

              <SummaryCard
                title="Risk"
                value={risk}
                color="bg-red-100"
                icon={
                  <AlertTriangle
                    className="text-red-600"
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

              {/* BAR */}
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

            {/* STUDENT INFO */}
            <Card>

              <h3
                className="
                  text-2xl font-bold
                  mb-6
                "
              >
                Student Information
              </h3>

              <div
                className="
                  grid grid-cols-1
                  md:grid-cols-2
                  xl:grid-cols-4 gap-4
                "
              >

                <InfoItem
                  label="Name"
                  value={
                    student.name ||
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
                  value={student.email}
                />

                <InfoItem
                  label="Risk Level"
                  value={risk}
                />

              </div>

            </Card>

          </>
        )}

        {/* PROGRESS */}
        {activeMenu === "progress" && (

          <Card>

            <h3
              className="
                text-2xl font-bold
                mb-6
              "
            >
              Progress Summary
            </h3>

            <div
              className="
                grid grid-cols-1
                md:grid-cols-3 gap-5
              "
            >

              <SummaryCard
                title="Completed"
                value={completed}
                color="bg-green-100"
                icon={
                  <CheckCircle2
                    className="text-green-600"
                  />
                }
              />

              <SummaryCard
                title="Delayed"
                value={delayed}
                color="bg-orange-100"
                icon={
                  <Clock3
                    className="text-orange-600"
                  />
                }
              />

              <SummaryCard
                title="At Risk"
                value={atRisk}
                color="bg-red-100"
                icon={
                  <AlertTriangle
                    className="text-red-600"
                  />
                }
              />

            </div>

          </Card>
        )}

        {/* MILESTONES */}
        {activeMenu === "milestones" && (

          <Card>

            <h3
              className="
                text-2xl font-bold
                mb-8
              "
            >
              Milestone Timeline
            </h3>

            <div className="flex justify-between">

              {(timeline || []).map(
                (t, i) => {

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
                }
              )}

            </div>

          </Card>
        )}

        {/* DOCUMENTS */}
        {activeMenu === "documents" && (

          <Card>

            <h3
              className="
                text-2xl font-bold
                mb-6
              "
            >
              Uploaded Documents
            </h3>

            {!documents.length && (
              <p className="text-gray-500">
                No documents uploaded yet.
              </p>
            )}

            <div className="space-y-4">

              {documents.map(
                (doc, i) => (

                  <div
                    key={i}
                    className="
                      border rounded-2xl
                      p-4 flex items-center
                      justify-between
                    "
                  >

                    <div>

                      <p className="font-semibold">
                        {doc.name ||
                          doc.filename ||
                          "Document"}
                      </p>

                      <p
                        className="
                          text-sm text-gray-500
                        "
                      >
                        {doc.date || "-"}
                      </p>

                    </div>

                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="
                          px-4 py-2 rounded-xl
                          bg-purple-100
                          text-purple-700
                        "
                      >
                        View
                      </a>
                    )}

                  </div>
                )
              )}

            </div>

          </Card>
        )}

        {/* REMARKS */}
        {activeMenu === "remarks" && (

          <Card>

            <h3
              className="
                text-2xl font-bold
                mb-6
              "
            >
              Supervisor Remarks
            </h3>

            {!remarks.length && (
              <p className="text-gray-500">
                No remarks available.
              </p>
            )}

            <div className="space-y-4">

              {remarks.map(
                (r, i) => (

                  <div
                    key={i}
                    className="
                      border rounded-2xl
                      p-5
                    "
                  >

                    <div
                      className="
                        flex justify-between
                        mb-2
                      "
                    >

                      <p className="font-semibold">
                        {r.supervisor ||
                          "Supervisor"}
                      </p>

                      <span
                        className="
                          text-sm text-gray-500
                        "
                      >
                        {r.date || "-"}
                      </span>

                    </div>

                    <p className="text-gray-700">
                      {r.remark ||
                        r.comment ||
                        "-"}
                    </p>

                  </div>
                )
              )}

            </div>

          </Card>
        )}

      </main>
    </div>
  );
}
