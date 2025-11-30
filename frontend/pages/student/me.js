// frontend/pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import ExpectedActualChart from "../../components/ExpectedActualChart";
import { calculateProgressWithTimeline } from "../../utils/calcProgress";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

// List of programme activities (MSc)
const ACTIVITIES = [
  "Development Plan & Learning Contract",
  "Proposal Defense Endorsed",
  "Pilot / Phase 1 Completed",
  "Phase 2 Data Collection Begun",
  "Annual Progress Review (Year 1)",
  "Phase 2 Data Collection Continued",
  "Seminar Completed",
  "Annual Progress Review (Year 2)",
  "Thesis Draft Completed",
  "Final Progress Review (Year 3)",
  "Viva Voce",
  "Corrections Completed",
  "Final Thesis Submission",
];

// Items that require mandatory evidence upload
const EVIDENCE_REQUIRED = new Set([
  "Development Plan & Learning Contract",
  "Annual Progress Review (Year 1)",
  "Annual Progress Review (Year 2)",
  "Final Progress Review (Year 3)",
]);

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Load JWT token
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    setToken(t);
  }, []);

  // Load student info from backend
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const txt = await res.text();
        if (!res.ok) throw new Error(txt);
        const data = JSON.parse(txt);
        setRow(data.row);
      } catch (err) {
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!row) return null;

  // Normalise date (DD/MM/YYYY → YYYY-MM-DD)
  function normalizeDate(d) {
    if (!d) return null;
    if (d.includes("/") && d.split("/").length === 3) {
      const [dd, mm, yyyy] = d.split("/");
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    return d;
  }

  const startDate = normalizeDate(row.start_date || row.raw?.["Start Date"]);

  // Compute progress + expected timeline
  const prog = calculateProgressWithTimeline(
    row.raw || {},
    row.programme || "",
    startDate
  );

  const percentage = prog.percentage;
  const completedCount = prog.doneCount;
  const totalCount = prog.total;

  /* ------------------------------
        TOGGLE ITEM
  ------------------------------ */
  async function toggleItem(key) {
    try {
      const res = await fetch(`${API}/api/tasks/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentEmail: row.email,
          key,
          actor: "student",
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j.error || JSON.stringify(j));

      await refreshRow();
    } catch (e) {
      alert("Toggle error: " + e.message);
    }
  }

  /* ------------------------------
        FILE UPLOAD
  ------------------------------ */
  async function uploadFile(e, key) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try:
      const form = new FormData();
      form.append("file", file);
      form.append("studentEmail", row.email);
      form.append("key", key);

      const res = await fetch(`${API}/api/tasks/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j.error || JSON.stringify(j));

      await refreshRow();
      alert("Uploaded");
    } catch (e) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  /* ------------------------------
        REFRESH AFTER ACTION
  ------------------------------ */
  async function refreshRow() {
    try {
      const res = await fetch(`${API}/api/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const txt = await res.text();
      if (!res.ok) return;
      const data = JSON.parse(txt);
      setRow(data.row);
    } catch (e) {}
  }

  /* ------------------------------
       RENDER CHECKLIST ACTIVITIES
  ------------------------------ */
  const activityRows = ACTIVITIES.map((label) => {
    const submittedCol = `${label} Submitted`;
    const urlCol = `${label} Submission URL`;
    const dateCol = `${label} StudentTickDate`;

    const done =
      String(row.raw?.[submittedCol] || "").toLowerCase() === "true" ||
      String(row.raw?.[label] || "").toLowerCase() === "true";

    const actual =
      row.raw?.[dateCol] || row.raw?.[label] || "—";

    return {
      key: label,
      activity: label,
      done,
      actual,
      url: row.raw?.[urlCol] || null,
    };
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      
      {/* HEADER */}
      <header className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Student Progress</h1>
        <p className="mt-2 text-lg">
          <strong>{row.student_name}</strong> — {row.programme}
        </p>
      </header>

      <div className="grid md:grid-cols-12 gap-6">
        
        {/* LEFT PANEL */}
        <div className="md:col-span-4 space-y-6">
          
          {/* STUDENT INFO CARD */}
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="text-lg font-semibold">{row.student_name}</div>
            <div className="text-sm text-gray-600">{row.programme}</div>

            <div className="mt-4 text-sm space-y-1">
              <div>
                <strong>Supervisor:</strong>{" "}
                {row.raw?.["Main Supervisor"] || "—"}
              </div>
              <div>
                <strong>Email:</strong> {row.email}
              </div>
              <div>
                <strong>Start Date:</strong> {startDate || "—"}
              </div>
            </div>
          </div>

          {/* PROGRESS DONUT */}
          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm font-medium mb-2">Progress</div>
            <div className="flex items-center gap-4">
              <DonutChart percentage={percentage} size={100} />
              <div>
                <div className="text-2xl font-bold">{percentage}%</div>
                <div className="text-sm text-gray-600">
                  {completedCount} of {totalCount} items completed
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="md:col-span-8 space-y-6">
          
          {/* CHECKLIST */}
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">
              Progress Checklist
            </h3>

            <div className="space-y-3">
              {activityRows.map((r) => (
                <div
                  key={r.key}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div>
                    <div className="font-medium">{r.activity}</div>
                    <div className="text-sm text-gray-500">
                      Actual: {r.actual || "—"}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    
                    {/* Toggle */}
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!r.done}
                        onChange={() => toggleItem(r.key)}
                        className="w-4 h-4"
                      />
                      <span>Tick</span>
                    </label>

                    {/* File upload for required evidence */}
                    {EVIDENCE_REQUIRED.has(r.key) && (
                      <input
                        type="file"
                        disabled={uploading}
                        onChange={(e) => uploadFile(e, r.key)}
                      />
                    )}

                    {/* Link to existing file */}
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-purple-600 hover:underline"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TIMELINE TABLE */}
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">
              Expected vs Actual (timeline)
            </h3>

            {/* USE PROG.ITEMS HERE */}
            <TimelineTable rows={prog.items} />

            <div className="mt-2 text-sm text-gray-500">
              Expected dates are computed from your start date.
            </div>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="text-xl font-semibold text-purple-700 mb-4">
          Expected vs Actual Chart
        </h3>

        <ExpectedActualChart items={prog.items} />
      </div>
    </div>
  );
}
