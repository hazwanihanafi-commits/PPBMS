import { useEffect, useState } from "react";
import { useAuthGuard } from "@/utils/useAuthGuard";
import { authFetch } from "@/utils/authFetch";

import StudentChecklist from "../../components/StudentChecklist";
import TimelineSummary from "../../components/TimelineSummary";
import CompletionDonut from "../../components/CompletionDonut";
import TopBar from "../../components/TopBar";
import FinalPLOTable from "../../components/FinalPLOTable";
import AllPLOTable from "../../components/AllPLOTable";

export default function StudentPage() {

  const { ready, user } =
    useAuthGuard("student");

  const [profile, setProfile] =
    useState(null);

  const [timeline, setTimeline] =
    useState([]);

  const [remarks, setRemarks] =
    useState([]);

  const [activeTab, setActiveTab] =
  useState("dashboard");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [responseInputs, setResponseInputs] = useState({});

  /* =========================
     LOAD
  ========================= */

  useEffect(() => {

    if (!ready) return;

    loadStudent();

  }, [ready]);

  async function loadStudent() {

    setLoading(true);
    setError("");

    try {

      const res =
        await authFetch(
          "/api/student/me"
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.error
        );
      }

      setProfile(data.row);

      setTimeline(
        data.row.timeline || []
      );

      setRemarks(data.row.remarks || []);

    } catch (e) {

      setError(
        e.message ||
        "Unable to load student data"
      );

    }

    setLoading(false);
  }

  /* =========================
     UPDATE
  ========================= */

  async function markCompleted(
    activity
  ) {

    const date =
      new Date()
        .toISOString()
        .slice(0, 10);

    await authFetch(
      "/api/student/update-actual",
      {
        method: "POST",
        body: JSON.stringify({
          activity,
          date,
        }),
      }
    );

    loadStudent();
  }

  async function resetCompleted(
    activity
  ) {

    if (
      !confirm(
        "Are you sure you want to reset this milestone?"
      )
    ) {
      return;
    }

    await authFetch(
      "/api/student/reset-actual",
      {
        method: "POST",
        body: JSON.stringify({
          activity,
        }),
      }
    );

    loadStudent();
  }



  async function submitResponse(instance, responseText) {
  try {
    await authFetch("/api/student/cqi/student-response", {
      method: "POST",
      body: JSON.stringify({
  matric: profile.student_id,   // 🔥 IMPORTANT FIX
  assessmentInstance: instance,
  studentResponse: responseText
})
    });

    loadStudent(); // refresh

  } catch (e) {
    console.error("student response error:", e);
  }
}
  /* =========================
     CALCULATIONS
  ========================= */

  const completed = timeline.filter(
    (t) =>
      t.status
        ?.trim()
        .toLowerCase() ===
      "completed"
  ).length;

  const late = timeline.filter(
    (t) =>

      t.status
        ?.trim()
        .toLowerCase() ===
        "late" ||

      t.status
        ?.trim()
        .toUpperCase() ===
        "AT_RISK" ||

      (
        !t.actual &&
        t.remaining_days < 0 &&
        t.status
          ?.trim()
          .toLowerCase() !==
          "completed"
      )
  ).length;

  const progress = timeline.length
    ? Math.round(
        (
          completed /
          timeline.length
        ) * 100
      )
    : 0;

  /* =========================
     LOADING
  ========================= */

  if (!ready) {
    return (
      <div className="p-6 text-center">
        Checking access…
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
  <>
    <TopBar user={user} />

    <div className="flex min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#ede9fe] text-gray-800">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-2xl border-r hidden md:flex flex-col">

        <div className="p-6 border-b">

          <h1 className="text-2xl font-bold text-purple-700">
            PPBMS
          </h1>

          <p className="text-xs text-gray-500 mt-1">
            Postgraduate Monitoring System
          </p>

        </div>

        <nav className="flex-1 p-4 space-y-2">

          {[
            {
              key: "dashboard",
              label: "🏠 Dashboard"
            },
            {
              key: "timeline",
              label: "📅 Timeline"
            },
            {
              key: "documents",
              label: "📁 Documents"
            },
            {
  key: "plo",
  label: "🎯 PLO Achievement"
},
            {
              key: "remarks",
              label: "💬 Remarks"
            }
          ].map((item) => (

            <button
              key={item.key}
              onClick={() =>
                setActiveTab(item.key)
              }
              className={`w-full text-left px-4 py-3 rounded-2xl transition font-medium ${
                activeTab === item.key
                  ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow"
                  : "hover:bg-purple-50 text-gray-700"
              }`}
            >
              {item.label}
            </button>

          ))}

        </nav>

      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* HERO */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 text-white p-6 shadow-xl">

          <h1 className="text-2xl font-semibold tracking-tight">
            Postgraduate Research Progress Overview
          </h1>

          <p className="text-purple-100 mt-1 text-sm">
            {profile.student_name} · {profile.programme}
          </p>

        </div>

        {/* ALERT */}
        {late > 0 && (

          <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-2xl shadow">

            ⚠️ There are {late} overdue milestone(s)
            requiring immediate attention.

          </div>

        )}

        {/* TOP SUMMARY */}
        <div className="grid lg:grid-cols-4 gap-6">

          {/* PROFILE */}
          <div className="lg:col-span-2 rounded-3xl bg-white/70 backdrop-blur-xl shadow p-6">

            <h2 className="text-lg font-semibold mb-4 border-b pb-2">
              Student Information
            </h2>

            <div className="grid md:grid-cols-2 gap-3 text-sm">

              <p>
                <span className="font-medium">
                  Matric Number:
                </span>{" "}
                {profile.student_id}
              </p>

              <p>
                <span className="font-medium">
                  Email:
                </span>{" "}
                {profile.email}
              </p>

              <p>
                <span className="font-medium">
                  Programme:
                </span>{" "}
                {profile.programme}
              </p>

              <p>
                <span className="font-medium">
                  Supervisor:
                </span>{" "}
                {profile.supervisor}
              </p>

              <p className="md:col-span-2">
                <span className="font-medium">
                  Co-Supervisor(s):
                </span>{" "}
                {(
                  profile.cosupervisor ||
                  profile.cosupervisors ||
                  profile.co_supervisor ||
                  "-"
                )
                  .split(/[,;]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .join(", ")}
              </p>

            </div>

          </div>

          {/* DONUT */}
          <div className="rounded-3xl bg-white/70 backdrop-blur shadow p-4 flex items-center justify-center">

            <CompletionDonut
              percent={progress}
            />

          </div>

          {/* KPI */}
          <div className="space-y-4">

            <div className="rounded-2xl p-4 bg-green-50 shadow">
              <p className="text-sm text-gray-600">
                Completed
              </p>

              <h2 className="text-2xl font-bold text-green-700">
                {completed}
              </h2>
            </div>

            <div className="rounded-2xl p-4 bg-blue-50 shadow">
              <p className="text-sm text-gray-600">
                On Track
              </p>

              <h2 className="text-2xl font-bold text-blue-700">
                {timeline.length - completed - late}
              </h2>
            </div>

            <div className="rounded-2xl p-4 bg-red-50 shadow">
              <p className="text-sm text-gray-600">
                Overdue
              </p>

              <h2 className="text-2xl font-bold text-red-700">
                {late}
              </h2>
            </div>

          </div>

        </div>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (

          <>

            {/* TIMELINE SUMMARY */}
            <div className="rounded-3xl bg-white/70 backdrop-blur shadow p-6">

              <h2 className="text-lg font-semibold mb-4">
                Timeline Summary
              </h2>

              <TimelineSummary
                timeline={timeline}
              />

            </div>

            {/* SYSTEM INSIGHT */}
            <div className="rounded-2xl bg-white shadow p-5">

              <p className="text-xs text-gray-500 uppercase tracking-wide">
                System Insight
              </p>

              <p className="mt-2 text-sm font-medium">

                {late > 0
                  ? "There are overdue milestones requiring immediate attention."
                  : "All milestones are progressing within the expected timeline."}

              </p>

            </div>

            {/* FINAL PLO */}
            {profile?.finalPLO &&
              Object.keys(profile.finalPLO).length > 0 && (

                <div className="rounded-3xl bg-white shadow p-6">

                  <h2 className="text-lg font-semibold mb-4">
                    Final PLO Achievement
                  </h2>

                  <FinalPLOTable
                    finalPLO={profile.finalPLO}
                  />

                </div>

            )}

          </>

        )}

        {/* TIMELINE */}
        {activeTab === "timeline" && (

          <div className="grid gap-4">

            {timeline.map((t, i) => {

              const isLate =
                t.status?.trim().toLowerCase() === "late" ||
                t.status?.trim().toUpperCase() === "AT_RISK" ||
                (!t.actual &&
                  t.remaining_days < 0 &&
                  t.status?.trim().toLowerCase() !== "completed");

              return (

                <div
                  key={i}
                  className={`rounded-2xl p-5 shadow border-l-4 ${
                    isLate
                      ? "border-red-500 bg-red-50"
                      : t.remaining_days <= 30
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-green-400 bg-white"
                  }`}
                >

                  <div className="flex justify-between mb-2">

                    <h4 className="font-semibold">
                      {t.activity}
                    </h4>

                    <span className="text-sm font-bold text-purple-700">

                      {t.remaining_days < 0
                        ? `${Math.abs(
                            t.remaining_days
                          )} days overdue`
                        : `${t.remaining_days} days`}

                    </span>

                  </div>

                  <p className="text-sm text-gray-600">
  Expected: {t.expected || "-"} |
  Actual: {t.actual || "-"}
</p>

<div className="mt-4 flex gap-3">

  {!t.actual ? (

    <button
      onClick={() =>
        markCompleted(t.activity)
      }
      className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm hover:bg-purple-700 transition"
    >
      Mark Completed
    </button>

  ) : (

    <button
      onClick={() =>
        resetCompleted(t.activity)
      }
      className="px-4 py-2 rounded-xl bg-red-100 text-red-700 text-sm hover:bg-red-200 transition"
    >
      Reset Timeline
    </button>

  )}

</div>

                </div>

              );
            })}

          </div>

        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (

          <div className="rounded-3xl bg-white/70 backdrop-blur shadow p-6">

            <StudentChecklist
              documents={profile.documents || {}}
              programme={profile.programme || ""}
              onSaved={loadStudent}
            />

          </div>

        )}

        {/* PLO */}
{activeTab === "plo" && (

  <div className="space-y-6">

    {/* ALL PLO */}
    {profile?.allPLO &&
      Object.keys(profile.allPLO).length > 0 && (

        <div className="rounded-3xl bg-white shadow p-6">

          <h2 className="text-lg font-semibold mb-4">
            🎯 All PLO Attainment
          </h2>

          <AllPLOTable
            allPLO={profile.allPLO}
          />

        </div>

    )}


{/* PLO FRAMEWORK LIBRARY */}
<div className="rounded-3xl bg-white shadow p-6">

  <h2 className="text-lg font-semibold mb-6">
    📘 Programme & Assessment Framework
  </h2>

  {/* MAIN PLO OVERVIEW */}
  <div className="mb-8 border rounded-2xl p-4 bg-gray-50">

    <h3 className="font-semibold text-purple-700 text-lg">
      🎯 Main PLO Mapping Overview
    </h3>

    <p className="text-sm text-gray-500 mt-2">
      Overall mapping between programme learning outcomes
      and assessment components.
    </p>

    <img
      src="/Assessments-mapping.png"
      alt="Main PLO Mapping"
      className="mt-5 rounded-xl border w-full"
    />

  </div>

  {/* DETAIL REFERENCES */}
  <div className="grid md:grid-cols-2 gap-6">

    {/* TRX500 */}
    <div className="border rounded-2xl p-4">

      <h3 className="font-semibold text-purple-700">
        Research Methodology Course (TRX500)
      </h3>

      <img
        src="/trx500-mapping.png"
        alt="TRX500"
        className="mt-4 rounded-xl border w-full"
      />

    </div>

    {/* PROGRESS REPORT */}
    <div className="border rounded-2xl p-4">

      <h3 className="font-semibold text-purple-700">
        Progress Review
      </h3>

      <img
        src="/progress-report.png"
        alt="Progress"
        className="mt-4 rounded-xl border w-full"
      />

    </div>

    {/* TURNITIN */}
    <div className="border rounded-2xl p-4">

      <h3 className="font-semibold text-purple-700">
        Similarity Index
      </h3>

      <img
        src="/turnitin-mapping.png"
        alt="Similarity"
        className="mt-4 rounded-xl border w-full"
      />

    </div>

    {/* THESIS */}
    <div className="border rounded-2xl p-4">

      <h3 className="font-semibold text-purple-700">
        Thesis Examination
      </h3>

      <img
        src="/thesis-exam.png"
        alt="Thesis"
        className="mt-4 rounded-xl border w-full"
      />

    </div>

    {/* VIVA */}
    <div className="border rounded-2xl p-4 md:col-span-2">

      <h3 className="font-semibold text-purple-700">
        Viva Voce
      </h3>

      <img
        src="/viva-voce.png"
        alt="Viva"
        className="mt-4 rounded-xl border w-full"
      />

    </div>

  </div>

</div>

</div>

)}


{/* REMARKS */}
    
        {/* REMARKS */}
        {activeTab === "remarks" && (

          <div className="space-y-4">

            {remarks.length === 0 ? (

              <div className="bg-white rounded-2xl p-6 shadow text-sm text-gray-500">
                No supervisor remarks yet.
              </div>

            ) : (

              Object.entries(
                remarks.reduce((acc, r) => {

                  const key =
                    r.assessmentInstance;

                  if (!key) return acc;

                  if (!acc[key]) acc[key] = [];

                  acc[key].push(r);

                  return acc;

                }, {})
              ).map(([instance, items]) => (

                <div
                  key={instance}
                  className="bg-white rounded-2xl p-5 shadow"
                >

                  <div className="flex justify-between items-center mb-4">

                    <h4 className="font-semibold text-purple-700">
                      {instance.replace("_", " ")}
                    </h4>

                    <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
                      {items[0]?.status || "PENDING"}
                    </span>

                  </div>

                  {items.map((r, i) => (

                    <div
                      key={i}
                      className="space-y-3 mb-5"
                    >

                      <div className="bg-gray-50 rounded-xl p-4 text-sm">
                        {r.supervisorRemark ||
                          r.supervisor_remark}
                      </div>

                    </div>

                  ))}

                </div>

              ))

            )}

          </div>

        )}

        {/* FOOTER */}
        <footer className="text-center text-xs text-gray-400 py-6 border-t mt-10">

          © 2026 Postgraduate Portfolio-Based Monitoring System (PPBMS)

          <br />

          Universiti Sains Malaysia

        </footer>

      </main>

    </div>
  </>
);
}
 
 
