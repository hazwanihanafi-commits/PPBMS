// frontend/components/SubmissionFolder.jsx
import React, { useState } from "react";

/*
  Props:
    - raw: the row.raw object returned by your student API (contains the sheet columns)
    - token: optional auth token (will be read from localStorage if not provided)
*/
export default function SubmissionFolder({ raw = {}, token }) {
  token = token || (typeof window !== "undefined" && localStorage.getItem("ppbms_token"));

  const ACTIVITIES = [
    { key: "P1 Submitted", label: "P1 – Development Plan & Learning Contract", docKey: "Submission Document P1", editUrlKey: "Submission Edit URL P1" },
    { key: "P3 Submitted", label: "P3 – Research Logbook (Daily/Weekly)", docKey: "Submission Document P3", editUrlKey: "Submission Edit URL P3" },
    { key: "P4 Submitted", label: "P4 – Monthly Portfolio Monitoring Form", docKey: "Submission Document P4", editUrlKey: "Submission Edit URL P4" },
    { key: "P5 Submitted", label: "P5 – Annual Portfolio Review (MSc/PhD)", docKey: "Submission Document P5", editUrlKey: "Submission Edit URL P5" },
    // the extra activities that are tracked in the 12-activity model
    { key: "Thesis Draft Completed", label: "Thesis Draft Completed", docKey: "Submission Document Thesis Draft", editUrlKey: "Submission Edit URL Thesis Draft" },
    { key: "Ethical clearance obtained", label: "Ethical clearance obtained", docKey: "Submission Document Ethics", editUrlKey: "Submission Edit URL Ethics" },
    { key: "Pilot or Phase 1 completed", label: "Pilot / Phase 1 completed", docKey: "Submission Document Pilot", editUrlKey: "Submission Edit URL Pilot" },
    { key: "Progress approved", label: "Progress approved", docKey: "Submission Document Progress", editUrlKey: "Submission Edit URL Progress" },
    { key: "Seminar & report submitted", label: "Seminar & report submitted", docKey: "Submission Document Seminar", editUrlKey: "Submission Edit URL Seminar" },
    { key: "Phase 2 completed", label: "Phase 2 completed", docKey: "Submission Document Phase2", editUrlKey: "Submission Edit URL Phase2" },
    { key: "1 indexed paper submitted", label: "1 indexed paper submitted", docKey: "Submission Document Paper1", editUrlKey: "Submission Edit URL Paper1" },
    { key: "Conference presentation", label: "Conference presentation", docKey: "Submission Document Conference", editUrlKey: "Submission Edit URL Conference" },
  ];

  const [uploadingFor, setUploadingFor] = useState(null);

  async function handleFileUpload(actionKey, file) {
    if (!file) return;
    setUploadingFor(actionKey);

    // ATTENTION: This expects a backend endpoint /api/student/upload to accept multipart/form-data
    // If you don't have it yet, change the URL or implement the server side accordingly.
    const form = new FormData();
    form.append("file", file);
    form.append("activity", actionKey);
    form.append("studentEmail", raw["Student's Email"] || raw["Student Email"] || raw.email);

    try {
      const res = await fetch("/api/student/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      alert("Upload successful");
      // ideally, re-fetch student data to refresh the page
    } catch (err) {
      console.error("upload err", err);
      alert("Upload failed: " + (err.message || err));
    } finally {
      setUploadingFor(null);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h3 className="text-xl font-semibold text-purple-700 mb-4">Submission Folder</h3>

      <div className="space-y-6">
        {ACTIVITIES.map((act) => {
          const isSubmitted = raw[act.key] && raw[act.key].toString().trim() !== "";
          const submittedAt = raw[act.key] || null;
          const docUrl = raw[act.docKey] || null;
          const editUrl = raw[act.editUrlKey] || null;

          return (
            <div key={act.key} className="border-b pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{act.label}</div>
                  <div className="text-sm text-gray-600">
                    Status: {isSubmitted ? <span className="text-green-600">Submitted</span> : <span className="text-orange-600">Pending</span>}
                  </div>
                  <div className="text-sm text-gray-500">Date: {submittedAt || "—"}</div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {docUrl && (
                    <a href={docUrl} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">
                      View Submission File
                    </a>
                  )}

                  {editUrl ? (
                    <a href={editUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-purple-50 text-purple-700 rounded">
                      Open Submission Form
                    </a>
                  ) : (
                    // if no editURL present, show an upload control
                    <label className="px-4 py-2 bg-purple-600 text-white rounded cursor-pointer">
                      {uploadingFor === act.key ? "Uploading…" : "Upload file"}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(act.key, f);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
