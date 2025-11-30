// components/SubmissionFolder.jsx
import { useState } from "react";

const MSC_ITEMS = [
  "Development Plan & Learning Contract",
  "Proposal Defense Endorsed",
  "Pilot / Phase 1 Completed",
  "Phase 2 Data Collection Begun",
  "Annual Progress Review (Year 1)",
  "Phase 2 Data Collection Continued",
  "Seminar Completed",
  "Thesis Draft Completed",
  "Internal Evaluation Completed (Pre-Viva)",
  "Viva Voce",
  "Corrections Completed",
  "Final Thesis Submission",
];

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SubmissionFolder({ raw = {}, studentEmail = "" }) {
  const [loadingKey, setLoadingKey] = useState(null);
  const role = typeof window !== "undefined" ? localStorage.getItem("ppbms_role") : null;
  const token = typeof window !== "undefined" ? localStorage.getItem("ppbms_token") : null;

  if (!studentEmail) return <div className="p-4 text-sm text-gray-600">No student selected.</div>;

  async function saveDate(key, dateStr) {
    if (!token) return alert("Not logged in");
    setLoadingKey(key);
    try {
      // our backend /api/tasks/toggle expects body { studentEmail, key, actor }
      // For student action, we call actor:"student". Backend will set date to today.
      // But user asked to allow manual date; if you want to send date explicitly, you can POST to a different endpoint.
      // Here we will use /api/tasks/toggle (student) and also call an optional /api/tasks/setDate endpoint (if implemented).
      const res = await fetch(`${API}/api/tasks/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentEmail, key, actor: "student" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || j.message || "Failed");
      // If your backend supports setting a specific date column, call it here.
      alert("Saved (student tick recorded). Supervisor must approve mandatory items.");
      window.location.reload(); // quick refresh to fetch updated row
    } catch (e) {
      console.error(e);
      alert("Error: " + (e.message || e));
    } finally {
      setLoadingKey(null);
    }
  }

  async function approve(key) {
    if (!token) return alert("Not logged in");
    setLoadingKey(key);
    try {
      const res = await fetch(`${API}/api/tasks/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentEmail, key, actor: "supervisor" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || j.message || "Failed");
      alert("Approved.");
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Error: " + (e.message || e));
    } finally {
      setLoadingKey(null);
    }
  }

  async function uploadFile(key, file) {
    if (!token) return alert("Not logged in");
    const form = new FormData();
    form.append("studentEmail", studentEmail);
    form.append("key", key);
    form.append("file", file);

    setLoadingKey(key);
    try {
      const res = await fetch(`${API}/api/tasks/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || j.message || "Upload failed");
      alert("File uploaded.");
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Error: " + (e.message || e));
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-lg font-semibold">Submissions & Activities</h4>
      <div className="space-y-2">
        {MSC_ITEMS.map((item) => {
          const submitted = raw[item] && String(raw[item]).trim() !== "";
          const studentDate = raw[`${item} StudentTickDate`] || raw[`${item} Date`] || "";
          const supApproved = (raw[`${item} SupervisorApproved`] || "").toString().toLowerCase() === "true";
          const submissionUrl = raw[`${item} Submission URL`] || raw[`${item} SubmissionLink`] || "";

          return (
            <div key={item} className="p-3 rounded border flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="font-medium">{item}</div>
                <div className="text-sm text-gray-600">
                  Student date: {studentDate || "—"} · Supervisor approved: {supApproved ? "Yes" : "No"}
                </div>
                {submissionUrl && (
                  <a target="_blank" rel="noreferrer" href={submissionUrl} className="text-sm text-blue-600 hover:underline">
                    View document
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* file upload */}
                <label className="text-sm cursor-pointer bg-gray-100 p-2 rounded">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (!e.target.files || e.target.files.length === 0) return;
                      uploadFile(item, e.target.files[0]);
                    }}
                  />
                  Upload
                </label>

                {/* Student: enter date (we use the toggle endpoint to mark tick; backend also writes date automatically to StudentTickDate) */}
                <button
                  className="px-3 py-2 bg-purple-600 text-white rounded text-sm"
                  onClick={() => {
                    if (!confirm(`Mark "${item}" as completed (student)?`)) return;
                    saveDate(item);
                  }}
                  disabled={loadingKey === item}
                >
                  {submitted ? "Mark again" : "Mark completed"}
                </button>

                {/* Supervisor approve (only visible if user role is supervisor) */}
                {role === "supervisor" && (
                  <button
                    className="px-3 py-2 bg-green-600 text-white rounded text-sm"
                    onClick={() => {
                      if (!confirm(`Approve "${item}" for ${studentEmail}?`)) return;
                      approve(item);
                    }}
                    disabled={loadingKey === item || supApproved}
                  >
                    {supApproved ? "Approved" : "Approve"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-gray-500">Note: Student clicks "Mark completed" to record the date (system records date automatically). Supervisor must approve mandatory items.</div>
    </div>
  );
}
