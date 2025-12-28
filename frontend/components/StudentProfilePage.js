import { useState } from "react";
import Tabs from "./StudentTabs";
import SupervisorChecklist from "./SupervisorChecklist";
import SupervisorRemark from "./SupervisorRemark";
import FinalPLOTable from "./FinalPLOTable";

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
      <Tabs active={activeTab} setActive={setActiveTab} />

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

          {/* FINAL PLO */}
          <FinalPLOTable finalPLO={student.finalPLO} />

          {/* SUPERVISOR REMARKS — ONLY FOR SUPERVISOR */}
          {role === "supervisor" &&
            Object.keys(student.cqiByAssessment || {}).map(type => (
              <SupervisorRemark
                key={type}
                studentMatric={student.student_id}
                studentEmail={student.email}
                assessmentType={type}
                initialRemark={student.remarksByAssessment?.[type]}
              />
            ))}
        </div>
      )}
    </div>
  );
}
