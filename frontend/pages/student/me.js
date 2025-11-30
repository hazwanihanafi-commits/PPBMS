// frontend/pages/student/me.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import { calculateProgress } from "../../utils/calcProgress";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

const MSC_ITEMS = [
  "Development Plan & Learning Contract",
  "Proposal Defense Endorsed",
  "Pilot / Phase 1 Completed",
  "Phase 2 Data Collection Begun",
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

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Get token
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    setToken(t);
  }, []);

  // Load student data
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${API}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text);
        const data = JSON.parse(text);
        setRow(data.row);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!row) return null;

  const programme = (row.programme || "").toLowerCase();
  const items = MSC_ITEMS; // Using MSC for now—update based on programme if needed.

  // FIXED PROGRESS ENGINE
  const prog = calculateProgress(row.raw || {}, row.programme || "", row.start_date);
  const percentage = prog.percentage;
  const completedCount = prog.doneCount;
  const totalCount = prog.total;

  // Toggle item
  async function toggleItem(key) {
    try {
      const res = await fetch(`${API}/api/tasks/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentEmail: row.email, key, actor: "student" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      refreshRow();
    } catch (err) {
      alert("Toggle failed: " + err.message);
    }
  }

  async function uploadFile(e, key) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
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
      if (!res.ok) throw new Error(j.error);

      refreshRow();
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function refreshRow() {
    const res = await fetch(`${API}/api/student/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const txt = await res.text();
    const data = JSON.parse(txt);
    setRow(data.row);
  }

  // FIXED done / actual logic
  const activityRows = items.map((label) => {
    const submittedCol = `${label} Submitted`;
    const urlCol = `${label} Submission URL`;

    return {
      activity: label,
      key: label,
      actual: row.raw?.[submittedCol] ? row.raw[submittedCol] : row.raw?.[`${label} StudentTickDate`] || "—",
      done: String(row.raw?.[submittedCol] || "").toLowerCase() === "true",
      url: row.raw?.[urlCol] || null,
    };
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      {/* Header */}
      <header className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Student Progress</h1>
        <p className="text-lg mt-2">{row.student_name} — {row.programme}</p>
      </header>

      <div className="grid md:grid-cols-12 gap-6">

        {/* LEFT PANEL */}
        <div className="md:col-span-4 space-y-6">

          {/* Student info */}
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="font-bold text-xl">{row.student_name}</div>
            <div className="text-gray-600">{row.programme}</div>

            <div className="mt-4 text-sm space-y-1">
              <div><b>Supervisor:</b> {row.raw?.["Main Supervisor"] || "—"}</div>
              <div><b>Email:</b> {row.email}</div>
              <div><b>Start Date:</b> {row.start_date}</div>
            </div>
          </div>

          {/* Progress donut */}
          <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
            <DonutChart percentage={percentage} size={90} />
            <div>
              <div className="text-2xl font-bold">{percentage}%</div>
              <div className="text-gray-600 text-sm">{completedCount} of {totalCount} completed</div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL – CHECKLIST */}
        <div className="md:col-span-8 space-y-6">

          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Progress Checklist</h3>

            <div className="space-y-4">

              {activityRows.map((r) => (
                <div key={r.key} className="flex justify-between items-center border-b pb-4">

                  {/* Label */}
                  <div>
                    <div className="font-medium">{r.activity}</div>
                    <div className="text-gray-600 text-sm">Actual: {r.actual}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4">

                    {/* Tick checkbox */}
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={r.done}
                        onChange={() => toggleItem(r.key)}
                        className="w-4 h-4"
                      />
                      Tick
                    </label>

                    {/* File upload */}
                    {["Development Plan & Learning Contract", "Final Thesis Submission", "Internal Evaluation Completed", "Annual Progress Review (Year 1)"].includes(r.key) && (
                      <input type="file" disabled={uploading} onChange={(e) => uploadFile(e, r.key)} />
                    )}

                    {/* View link */}
                    {r.url && (
                      <a href={r.url} target="_blank" className="text-purple-600 text-sm underline">
                        View
                      </a>
                    )}
                  </div>

                </div>
              ))}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
