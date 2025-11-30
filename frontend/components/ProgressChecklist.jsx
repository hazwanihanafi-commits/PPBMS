// frontend/components/ProgressChecklist.jsx
import React, { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function ProgressChecklist({ studentEmail, programme, currentUser }) {
  // currentUser = { email, role } — you can read from localStorage if you prefer
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const PLAN = (programme || "").toLowerCase().includes("msc")
    ? [
        "Development Plan & Learning Contract",
        "Proposal Defense Endorsed",
        "Pilot / Phase 1 Completed",
        "Phase 2 Data Collection Begun",
        "Annual Progress Review (Year 1)",
        "Phase 2 Data Collection Continued",
        "Seminar Completed",
        "Thesis Draft Completed",
        "Internal Evaluation Completed",
        "Viva Voce",
        "Corrections Completed",
        "Final Thesis Submission",
      ]
    : [
        "Development Plan & Learning Contract",
        "Proposal Defense Endorsed",
        "Pilot / Phase 1 Completed",
        "Annual Progress Review (Year 1)",
        "Phase 2 Completed",
        "Seminar Completed",
        "Data Analysis Completed",
        "1 Journal Paper Submitted",
        "Conference Presentation",
        "Annual Progress Review (Year 2)",
        "Thesis Draft Completed",
        "Internal Evaluation Completed",
        "Viva Voce",
        "Corrections Completed",
        "Final Thesis Submission",
      ];

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(`${API}/api/tasks/student/${encodeURIComponent(studentEmail)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(txt);
      const data = JSON.parse(txt);
      setStudent(data.student || {});
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (studentEmail) load(); }, [studentEmail]);

  if (loading) return <div>Loading checklist…</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!student) return <div>No student data</div>;

  const token = localStorage.getItem("ppbms_token");
  const isSupervisor = currentUser?.role === "supervisor" || currentUser?.role === "admin";
  const isStudentOwner = currentUser?.email === studentEmail;

  async function toggleTick(key) {
    try {
      const res = await fetch(`${API}/api/tasks/tick`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentEmail, key }),
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(txt);
      await load();
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  async function approve(key, approve=true) {
    try {
      const res = await fetch(`${API}/api/tasks/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentEmail, key, approve }),
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(txt);
      await load();
    } catch (e) {
      alert("Approve error: " + e.message);
    }
  }

  return (
    <div>
      <table className="w-full table-auto">
        <thead>
          <tr className="text-left">
            <th>Activity</th>
            <th style={{width:160}}>Student tick</th>
            <th style={{width:180}}>Supervisor</th>
          </tr>
        </thead>
        <tbody>
          {PLAN.map((key) => {
            const t = (student.ticks && student.ticks[key]) || {};
            return (
              <tr key={key} className="border-b">
                <td className="p-2">{key}</td>
                <td className="p-2">
                  {isStudentOwner ? (
                    <button
                      className={`px-3 py-1 rounded ${t.studentTick ? "bg-green-200" : "bg-gray-100"}`}
                      onClick={() => toggleTick(key)}
                    >
                      {t.studentTick ? `Ticked (${new Date(t.studentTickDate||"").toLocaleDateString()})` : "Mark complete"}
                    </button>
                  ) : (
                    <div>{t.studentTick ? <><strong>Yes</strong> <div className="text-xs">{new Date(t.studentTickDate||"").toLocaleDateString()}</div></> : "—"}</div>
                  )}
                </td>

                <td className="p-2">
                  {isSupervisor ? (
                    <>
                      <div className="mb-1">
                        {t.supervisorApproved ? <span className="text-green-700 font-semibold">Approved</span> : <span className="text-yellow-700">Pending</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => approve(key, true)} className="px-3 py-1 rounded bg-purple-600 text-white text-sm">Approve</button>
                        <button onClick={() => approve(key, false)} className="px-2 py-1 rounded bg-gray-200 text-sm">Reject</button>
                      </div>
                      <div className="text-xs mt-1">{t.supervisorApproveDate ? new Date(t.supervisorApproveDate).toLocaleString() : ""}</div>
                    </>
                  ) : (
                    <div>{t.supervisorApproved ? "Approved" : "Not approved"}</div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-3 text-sm text-gray-600">
        <em>Note: Student ticks require supervisor approval to count as completed.</em>
      </div>
    </div>
  );
}
