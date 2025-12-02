// frontend/pages/student/me.js
import { useEffect, useState } from "react";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import SubmissionFolder from "../../components/SubmissionFolder";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("progress");
  const [error, setError] = useState(null);

  // Load token
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
          headers: { Authorization: `Bearer ${token}` }
        });

        const txt = await res.text();
        if (!res.ok) throw new Error(txt);

        const data = JSON.parse(txt);
        setRow(data.row);

      } catch (e) {
        setError(e.message || e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!row) return null;

  // Progress calc
  const timeline = row.timeline || [];
  const completed = timeline.filter(t => t.status === "Completed").length;
  const total = timeline.length;

  const prog = {
    done: completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100)
  };

  const initials = (row.student_name || "NA")
    .split(" ")
    .map(s => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Field & Department fallbacks
  const field =
    row.raw?.Field ||
    row.raw?.["Field of Study"] ||
    row.raw?.["Research Field"] ||
    "-";

  const department =
    row.raw?.Department ||
    row.raw?.["Department Name"] ||
    row.raw?.["Dept"] ||
    "-";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Student Progress</h1>
        <p className="mt-2 text-lg">
          <strong>{row.student_name}</strong> — {row.programme}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* LEFT PANEL */}
        <div className="col-span-4 space-y-6">

          {/* Profile Card */}
          <div className="rounded-xl bg-white p-6 shadow flex flex-col gap-4">

            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center 
                              bg-gradient-to-br from-purple-600 to-pink-500 
                              text-white text-2xl font-bold shadow">
                {initials}
              </div>
              <div>
                <div className="font-semibold text-xl leading-tight">{row.student_name}</div>
                <div className="text-gray-600 text-sm">{row.programme}</div>
              </div>
            </div>

            {/* Details */}
            <div className="text-sm space-y-3 mt-2">
              
              <div>
                <div className="font-semibold text-gray-700">Supervisor</div>
                <div className="text-gray-800">{row.supervisor || "-"}</div>
              </div>

              <div>
                <div className="font-semibold text-gray-700">Start Date</div>
                <div className="text-gray-800">{row.start_date || "-"}</div>
              </div>

              <div>
                <div className="font-semibold text-gray-700">Field</div>
                <div className="text-gray-800">{field}</div>
              </div>

              <div>
                <div className="font-semibold text-gray-700">Department</div>
                <div className="text-gray-800">{department}</div>
              </div>

            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-xl bg-white p-4 shadow">
            <div className="flex gap-3 border-b pb-2 text-sm font-medium text-gray-600">
              <button
                className={tab === "progress" ? "text-purple-700 font-bold" : ""}
                onClick={() => setTab("progress")}
              >
                Progress
              </button>

              <button
                className={tab === "submissions" ? "text-purple-700 font-bold" : ""}
                onClick={() => setTab("submissions")}
              >
                Submissions
              </button>

              <button
                className={tab === "documents" ? "text-purple-700 font-bold" : ""}
                onClick={() => setTab("documents")}
              >
                Documents
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-8 space-y-6">

          {/* PROGRESS TAB */}
          {tab === "progress" && (
            <>
              <div className="rounded-xl bg-white p-6 shadow flex items-center gap-6">
                <DonutChart percentage={prog.percentage} size={130} />
                <div>
                  <div className="text-4xl font-bold">{prog.percentage}%</div>
                  <div className="text-gray-600">{prog.done} of {prog.total} items completed</div>
                </div>
              </div>

              {/* Timeline */}
              <TimelineWithSave
                row={row}
                token={token}
                API={API}
                onTimelineUpdate={(newTimeline) => {
                  setRow(prev => ({
                    ...prev,
                    timeline: newTimeline,
                  }));
                }}
              />
            </>
          )}

          {/* SUBMISSIONS TAB */}
          {tab === "submissions" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <SubmissionFolder raw={row.raw} studentEmail={row.email} />
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {tab === "documents" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <p>Documents & logbook links (upload to Submission Folder)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/*===========================================================
   TIMELINE WITH AUTO-SAVE
===========================================================*/
function TimelineWithSave({ row, token, API, onTimelineUpdate }) {
  const [timeline, setTimeline] = useState(row.timeline || []);

  async function saveActualDate(activity, date) {
    await fetch(`${API}/api/student/update-actual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        studentId: row.student_id,
        activity,
        date
      })
    });

    const res = await fetch(`${API}/api/student/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const txt = await res.text();
    const data = JSON.parse(txt);
    const updated = data.row.timeline;

    setTimeline(updated);

    if (onTimelineUpdate) onTimelineUpdate(updated);
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h3 className="text-xl font-semibold text-purple-700 mb-4">
        Expected vs Actual
      </h3>

      <TimelineTable timeline={timeline} onUpdate={saveActualDate} />
    </div>
  );
}
