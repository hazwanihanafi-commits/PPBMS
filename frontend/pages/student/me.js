import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

// EXPECTED DUE DATES
const DUE = {
  "P1 Submitted": "2024-08-31",
  "P3 Submitted": "2025-01-31",
  "P4 Submitted": "2025-02-15",
  "P5 Submitted": "2025-10-01",
};

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

  /* === CALCULATE PROGRESS === */
  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"]
  ].filter(Boolean).length;

  const percentage = Math.round((completed / 4) * 100);

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-10">
      <div className="max-w-3xl mx-auto space-y-8 px-4">

        {/* PAGE TITLE */}
        <h1 className="text-3xl font-extrabold text-[#0A0A23] text-center">
          Student Progress Overview
        </h1>

        {/* PROFILE CARD */}
        <Card>
          <h2 className="text-2xl font-bold text-[#0A0A23]">
            {row.student_name}
          </h2>
          <p className="text-gray-700">{row.programme}</p>
          <p><strong>Supervisor:</strong> {row.main_supervisor}</p>
          <p><strong>Email:</strong> {row.student_email}</p>
          <p><strong>Status:</strong> {row.raw["Status P"] || "—"}</p>
        </Card>

        {/* SUMMARY */}
        <Card>
          <h2 className="section-title">Summary</h2>
          <p><strong>Milestones Completed:</strong> {completed} / 4</p>
          <p>
            <strong>Last Submission:</strong>{" "}
            {row.raw["P5 Submitted"] ||
              row.raw["P4 Submitted"] ||
              row.raw["P3 Submitted"] ||
              row.raw["P1 Submitted"] ||
              "—"}
          </p>
          <p><strong>Overall Status:</strong> {row.raw["Status P"] || "—"}</p>
        </Card>

        {/* === PROGRESS CHART CARD === */}
        <Card>
          <h2 className="section-title">Progress Chart</h2>

          {/* Circular Progress */}
          <div className="flex flex-col items-center">
            <div
              className="relative flex items-center justify-center"
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: `conic-gradient(#0A0A23 ${percentage * 3.6}deg, #E5E7EB 0deg)`
              }}
            >
              <div className="absolute bg-white w-24 h-24 rounded-full flex items-center justify-center text-xl font-bold text-[#0A0A23]">
                {percentage}%
              </div>
            </div>
          </div>

          {/* Horizontal Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-[#0A0A23]"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1 text-right">{percentage}% completed</p>
          </div>
        </Card>

        {/* MILESTONE STATUS */}
        <Card>
          <h2 className="section-title">Milestone Status</h2>

          <Milestone label="P1 Submitted" value={row.raw["P1 Submitted"]} due={DUE["P1 Submitted"]} />
          <Milestone label="P1 Approved" value={row.raw["P1 Approved"]} />

          <Milestone label="P3 Submitted" value={row.raw["P3 Submitted"]} due={DUE["P3 Submitted"]} />
          <Milestone label="P3 Approved" value={row.raw["P3 Approved"]} />

          <Milestone label="P4 Submitted" value={row.raw["P4 Submitted"]} due={DUE["P4 Submitted"]} />
          <Milestone label="P4 Approved" value={row.raw["P4 Approved"]} />

          <Milestone label="P5 Submitted" value={row.raw["P5 Submitted"]} due={DUE["P5 Submitted"]} />
          <Milestone label="P5 Approved" value={row.raw["P5 Approved"]} />
        </Card>

      </div>
    </div>
  );
}

/* — Reusable Components — */

function Card({ children }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 space-y-3">
      {children}
    </div>
  );
}

function Milestone({ label, value, due }) {
  return (
    <p className="text-gray-800">
      <strong>{label}:</strong> {value || "—"}{" "}
      {due && <span className="text-gray-500">(Expected {due})</span>}
    </p>
  );
}
