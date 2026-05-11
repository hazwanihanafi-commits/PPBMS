import { useEffect, useState } from "react";
import { useAuthGuard } from "@/utils/useAuthGuard";
import { authFetch } from "@/utils/authFetch";

import StudentChecklist from "../../components/StudentChecklist";
import TimelineSummary from "../../components/TimelineSummary";
import CompletionDonut from "../../components/CompletionDonut";
import TopBar from "../../components/TopBar";
import FinalPLOTable from "../../components/FinalPLOTable";
import AllPLOTable from "../../components/AllPLOTable";
import AcademicFrameworkBoxes
from "../../components/AcademicFrameworkBoxes";

import AssessmentInfoBoxes
from "../../components/AssessmentInfoBoxes";

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
    useState("timeline");

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

  /* =========================
     UI
  ========================= */

  return (
    <>
      <TopBar user={user} />

      <div className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#ede9fe] p-6 space-y-6 text-gray-800">

        {/* HERO */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 text-white p-6 shadow-xl">

          <h1 className="text-2xl font-semibold tracking-tight">
            Postgraduate Research Progress Overview
          </h1>

          <p className="text-purple-100 mt-1 text-sm">
            {profile.student_name} ·{" "}
            {profile.programme}
          </p>

          <p className="text-purple-200 text-sm">
            {completed} of{" "}
            {timeline.length} milestones
            completed
          </p>

        </div>

        {/* ALERT */}
        {late > 0 && (

          <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-2xl shadow">

            ⚠️ There are {late} overdue
            milestone(s) requiring
            immediate attention.

          </div>

        )}

        {/* PROFILE */}
        <div className="rounded-3xl bg-white/50 backdrop-blur-xl shadow p-6">

          <h2 className="text-lg font-semibold mb-4 border-b pb-2">
            Student Information
          </h2>

          <div className="grid md:grid-cols-2 gap-2 text-sm">

            <p>
              <span className="font-medium">
                Matric Number:
              </span>{" "}
              {profile.student_id}
            </p>

            <p>
              <span className="font-medium">
                Email Address:
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
                Main Supervisor:
              </span>{" "}
              {profile.supervisor}
            </p>

            <p>
              <strong>
                Co-Supervisor(s):
              </strong>{" "}
              {(
  profile.cosupervisor ||
  profile.cosupervisors ||
  profile.co_supervisor ||
  "-"
)
  .split(/[,;]/)   // split by comma or ;
  .map(s => s.trim())
  .filter(Boolean)
  .join(", ")
}
            </p>

          </div>

        </div>

        {/* KPI */}
        <div className="grid md:grid-cols-3 gap-6">

          <div className="rounded-2xl p-5 bg-green-50 shadow">

            <p className="text-sm text-gray-600">
              Completed Milestones
            </p>

            <h2 className="text-2xl font-bold text-green-700">
              {completed}
            </h2>

          </div>

          <div className="rounded-2xl p-5 bg-blue-50 shadow">

            <p className="text-sm text-gray-600">
              Milestones Within Timeline
            </p>

            <h2 className="text-2xl font-bold text-blue-700">

              {timeline.length -
                completed -
                late}

            </h2>

          </div>

          <div className="rounded-2xl p-5 bg-red-50 shadow">

            <p className="text-sm text-gray-600">
              Overdue Milestones
            </p>

            <h2 className="text-2xl font-bold text-red-700">
              {late}
            </h2>

          </div>

        </div>

        {/* PROGRESS */}
        <div className="grid md:grid-cols-3 gap-6">

          <div className="rounded-3xl bg-white/50 backdrop-blur shadow p-4 flex justify-center">

            <CompletionDonut
              percent={progress}
            />

          </div>

          <div className="md:col-span-2 rounded-3xl bg-white/50 backdrop-blur shadow p-4">

            <TimelineSummary
              timeline={timeline}
            />

          </div>

        </div>

        {/* INSIGHT */}
        <div className="rounded-2xl bg-white shadow p-4">

          <p className="text-xs text-gray-500 uppercase tracking-wide">
            System Insight
          </p>

          <p className="mt-1 text-sm font-medium">

            {late > 0
              ? "There are overdue milestones requiring immediate attention."
              : "All milestones are progressing within the expected timeline."}

          </p>

        </div>

{/* FRAMEWORK */}
<AcademicFrameworkBoxes />

{/* ASSESSMENT REFERENCES */}
<AssessmentInfoBoxes />

{/* ALL PLO */}
{profile?.allPLO &&
  Object.keys(profile.allPLO).length > 0 && (
    <AllPLOTable allPLO={profile.allPLO} />
)}

{/* FINAL PLO */}
{profile?.finalPLO &&
  Object.keys(profile.finalPLO).length > 0 && (
    <FinalPLOTable finalPLO={profile.finalPLO} />
)}

  

        {/* TABS */}
        <div className="flex gap-3">

          {[
            "timeline",
            "documents",
            "remarks",
          ].map((tab) => (

            <button
              key={tab}
              onClick={() =>
                setActiveTab(tab)
              }
              className={`px-5 py-2 rounded-full font-semibold ${
                activeTab === tab
                  ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white"
                  : "bg-white/50"
              }`}
            >

              {tab === "timeline"
                ? "📅 Timeline"
                : tab === "documents"
                ? "📁 Documents"
                : "💬 Remarks"}

            </button>

          ))}

        </div>

        {/* TIMELINE */}
      {activeTab === "timeline" && (
  <div className="grid gap-4">

    {timeline.map((t, i) => {

      const isLate =
        t.status?.trim().toLowerCase() === "late" ||
        t.status?.trim().toUpperCase() === "AT_RISK" ||
        (!t.actual && t.remaining_days < 0 && t.status?.trim().toLowerCase() !== "completed");

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
            <h4 className="font-semibold">{t.activity}</h4>

            <span className="text-sm font-bold text-purple-700">
              {t.remaining_days < 0
                ? `${Math.abs(t.remaining_days)} days overdue`
                : `${t.remaining_days} days`}
            </span>
          </div>

          <p className="text-sm text-gray-600">
            Expected: {t.expected || "-"} | Actual: {t.actual || "-"}
          </p>

          <div className="mt-3 flex justify-between items-center">

            <span className="text-xs font-semibold">
              {isLate
                ? "Overdue – Attention Required"
                : t.status?.replaceAll("_", " ").trim()}
            </span>

            {t.actual ? (
              <button
                onClick={() => resetCompleted(t.activity)}
                className="text-xs text-red-600"
              >
                Reset Status
              </button>
            ) : (
              <button
                onClick={() => markCompleted(t.activity)}
                className="text-xs text-purple-700"
              >
                Mark as Completed
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
          <div className="rounded-3xl bg-white/50 backdrop-blur shadow p-6">

            <StudentChecklist
  documents={profile.documents || {}}
  programme={profile.programme || ""}
  onSaved={loadStudent}
/>

          </div>
        )}

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

          const key = r.assessmentInstance;

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

          <div className="flex justify-between items-center mb-3">

  <h4 className="font-semibold text-purple-700">
    {instance.replace("_", " ")}
  </h4>

  <span
    className={`text-xs px-3 py-1 rounded font-semibold ${
      items[0]?.status === "RESPONDED"
        ? "bg-green-100 text-green-700"
        : items[0]?.status === "PENDING"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-600"
    }`}
  >
    {items[0]?.status || "PENDING"}
  </span>

</div>
          {items.map((r, i) => {

            const instanceKey = instance.toUpperCase();
            const studentResp =
              r.studentResponse || r.student_response;

            return (
              <div key={i} className="mb-4">

                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 mb-2">
                  {r.supervisorRemark || r.supervisor_remark || "No remark"}
                </div>

                {studentResp && (
                  <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 mb-2">
                    <strong>Your response:</strong><br />
                    {studentResp}
                  </div>
                )}

                <textarea
                  placeholder="Write your response..."
                  className="w-full border rounded-lg p-2 text-sm"
                  value={responseInputs[instanceKey] || ""}
                  onChange={(e) =>
                    setResponseInputs({
                      ...responseInputs,
                      [instanceKey]: e.target.value
                    })
                  }
                />

                <button
                  onClick={() =>
                    submitResponse(
                      instanceKey,
                      responseInputs[instanceKey]
                    )
                  }
                  className="mt-2 px-4 py-1 text-sm bg-purple-600 text-white rounded-lg"
                >
                  Submit Response
                </button>

              </div>
            );
          })}

        </div>
      ))

    )}

  </div>
)}



        {/* FOOTER */}
        <footer className="text-center text-xs text-gray-400 py-6 border-t mt-10">

          © 2026 Postgraduate
          Portfolio-Based Monitoring
          System (PPBMS)

          <br />

          Universiti Sains Malaysia

          <br />

          Developed by{" "}
          <span className="font-medium text-gray-600">
            Hazwani Ahmad Yusof
          </span>{" "}
          (2025)

        </footer>

      </div>
    </>
  );
}
