import { useState } from "react";
import SupervisorChecklist from "./SupervisorChecklist";
import SupervisorRemark from "./SupervisorRemark";
import FinalPLOTable from "./FinalPLOTable";

function StudentTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "timeline", label: "Timeline" },
    { id: "documents", label: "Documents" },
    { id: "cqi", label: "CQI / PLO" },
  ];

  return (
    <div className="flex gap-2 mb-6">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${
            activeTab === t.id
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function StudentProfilePage({
  student,
  timeline,
  role
}) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-6">

      {/* ================= PROFILE HEADER ================= */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-extrabold mb-2">
          🎓 Student Profile ({role === "admin" ? "Admin View" : "Supervisor View"})
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div><strong>Name:</strong> {student.student_name}</div>
          <div><strong>Matric:</strong> {student.student_id}</div>
          <div><strong>Email:</strong> {student.email}</div>
          <div><strong>Programme:</strong> {student.programme}</div>
          <div><strong>Field:</strong> {student.field}</div>
          <div><strong>Department:</strong> {student.department}</div>
          <div><strong>Status:</strong> {student.status}</div>
          <div>
            <strong>Co-Supervisor(s):</strong>{" "}
            {student.coSupervisors?.length
              ? student.coSupervisors.join(", ")
              : "None"}
          </div>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <StudentTabs
  activeTab={activeTab}
  setActiveTab={setActiveTab}
/>

      {/* ================= OVERVIEW ================= */}
      {activeTab === "overview" && (
        <div className="bg-white p-6 rounded-2xl shadow">
          Student progress overview and compliance monitoring.
        </div>
      )}

      {/* ================= TIMELINE ================= */}
      {activeTab === "timeline" && (
        <div className="bg-white p-6 rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-purple-100">
              <tr>
                <th className="p-3 text-left">Activity</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Actual</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((t, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">{t.activity}</td>
                  <td className="p-3">{t.expected || "-"}</td>
                  <td className="p-3">{t.actual || "-"}</td>
                  <td className="p-3">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= DOCUMENTS ================= */}
      {activeTab === "documents" && (
        <div className="bg-white p-6 rounded-2xl shadow">
          <SupervisorChecklist documents={student.documents} />
        </div>
      )}

      {/* ================= CQI ================= */}
     {activeTab === "cqi" && (
  <div className="space-y-6">

    {/* FINAL PROGRAMME PLO */}
    <FinalPLOTable finalPLO={student.finalPLO || {}} />

    {/* PER-ASSESSMENT CQI */}
    {student.cqiByAssessment &&
    Object.keys(student.cqiByAssessment).length > 0 ? (
      Object.entries(student.cqiByAssessment).map(
        ([assessment, ploData]) => (
          <div
            key={assessment}
            className="bg-white p-5 rounded-xl shadow"
          >
            <h4 className="font-bold text-purple-700 mb-3">
              {assessment}
            </h4>

            <div className="flex flex-wrap gap-2">
              {Object.entries(ploData).map(([plo, d]) => (
                <span
                  key={plo}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    d.status === "Achieved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {plo}: {d.status}
                </span>
              ))}
            </div>

            {/* Supervisor remark */}
            {role === "supervisor" && (
              <SupervisorRemark
                studentMatric={student.student_id}
                studentEmail={student.email}
                assessmentType={assessment}
                initialRemark={
                  student.remarksByAssessment?.[assessment]
                }
              />
            )}
          </div>
        )
      )
    ) : (
      <div className="bg-white p-6 rounded-xl shadow text-gray-500 italic">
        No CQI / PLO assessment data available.
      </div>
    )}
  </div>
)}
