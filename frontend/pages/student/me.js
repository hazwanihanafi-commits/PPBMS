import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function StudentMe() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) window.location.href = "/login";
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;

    (async () => {
      const r = await fetch(`${API}/api/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      setRow(data.row);
    })();
  }, [token]);

  if (!row)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        Loading…
      </div>
    );

  // Count completed submissions
  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"]
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-3xl mx-auto space-y-8 px-4">

        {/* PAGE TITLE */}
        <h1 className="text-3xl font-extrabold text-purple-700 text-center">
          Student Progress Overview
        </h1>

        {/* PROFILE CARD */}
        <div className="bg-white p-6 rounded-xl shadow space-y-3">
          <h2 className="text-xl font-bold">{row.student_name}</h2>
          <p className="text-gray-600">{row.programme}</p>

          <p><strong>Supervisor:</strong> {row.main_supervisor}</p>
          <p><strong>Email:</strong> {row.student_email}</p>
          <p><strong>Status:</strong> {row.raw["Status P"] || "—"}</p>
        </div>

        {/* SUMMARY CARD */}
        <div className="bg-white p-6 rounded-xl shadow space-y-3">
          <h2 className="text-xl font-semibold">Summary</h2>

          <p><strong>Milestones Completed:</strong> {completed} / 4</p>

          <p><strong>Last Submission:</strong> 
            {row.raw["P5 Submitted"] ||
              row.raw["P4 Submitted"] ||
              row.raw["P3 Submitted"] ||
              row.raw["P1 Submitted"] ||
              "—"}
          </p>

          <p><strong>Overall Status:</strong> {row.raw["Status P"] || "—"}</p>
        </div>

        {/* MILESTONE STATUS CARD */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold">Milestone Status</h2>

          <div className="space-y-3">

            <MilestoneItem label="P1 Submitted" value={row.raw["P1 Submitted"]} />
            <MilestoneItem label="P1 Approved" value={row.raw["P1 Approved"]} />

            <MilestoneItem label="P3 Submitted" value={row.raw["P3 Submitted"]} />
            <MilestoneItem label="P3 Approved" value={row.raw["P3 Approved"]} />

            <MilestoneItem label="P4 Submitted" value={row.raw["P4 Submitted"]} />
            <MilestoneItem label="P4 Approved" value={row.raw["P4 Approved"]} />

            <MilestoneItem label="P5 Submitted" value={row.raw["P5 Submitted"]} />
            <MilestoneItem label="P5 Approved" value={row.raw["P5 Approved"]} />

          </div>
        </div>

      </div>
    </div>
  );
}

/* --- CLEAN COMPONENT FOR ITEMS --- */
function MilestoneItem({ label, value }) {
  return (
    <p>
      <strong>{label}: </strong>
      {value || "—"}
    </p>
  );
}
