// frontend/components/SubmissionFolder.jsx
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SubmissionFolder({ raw = {}, studentEmail, token }) {
  const [uploadingActivity, setUploadingActivity] = useState("");
  const [message, setMessage] = useState("");

  // Only the required ones — MUST match Google Sheet column names
  const mandatoryUploads = [
    "Development Plan & Learning Contract",
    "Annual Progress Review (Year 1)",
    "Annual Progress Review (Year 2)",
    "Final Thesis Submission",
  ];

  async function uploadFile(activity, file) {
    if (!file) {
      setMessage("❗ Please select a file before uploading.");
      return;
    }

    setUploadingActivity(activity);
    setMessage("");

    const form = new FormData();
    form.append("file", file);
    form.append("studentEmail", studentEmail);
    form.append("activity", activity);

    try {
      const res = await fetch(`${API}/api/tasks/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setMessage(`✅ Successfully uploaded for: ${activity}`);

      // Refresh the UI by reloading the page data
      setTimeout(() => {
        window.location.reload();
      }, 1200);

    } catch (err) {
      setMessage("❌ Upload failed: " + err.message);
    } finally {
      setUploadingActivity("");
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-purple-700 flex items-center gap-2">
        <span>📁 Submission Folder</span>
      </h3>

      <p className="text-sm text-gray-600">
        Uploads here will automatically update Google Sheets and notify your supervisor.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mandatoryUploads.map((activity) => {
          const url = raw[`${activity} - FileURL`];
          const hasFile = Boolean(url);

          return (
            <div
              key={activity}
              className="border rounded-xl bg-white p-5 shadow-md transition hover:shadow-lg"
            >
              {/* Title */}
              <div className="font-semibold text-purple-700 text-sm mb-1">
                {activity}
              </div>

              {/* Status */}
              <div className="mb-3 text-xs">
                {hasFile ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-700 underline font-medium"
                  >
                    ✔ File Uploaded — View File
                  </a>
                ) : (
                  <span className="text-red-500 font-medium">
                    ✖ No file uploaded yet
                  </span>
                )}
              </div>

              {/* File input */}
              <input
                type="file"
                className="block w-full text-xs mb-3"
                onChange={(e) =>
                  uploadFile(activity, e.target.files?.[0])
                }
                disabled={uploadingActivity === activity}
              />

              {/* Upload button */}
              <button
                disabled={uploadingActivity === activity}
                className={`w-full py-2 rounded-lg text-white text-sm font-medium transition 
                ${
                  uploadingActivity === activity
                    ? "bg-gray-400"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
                onClick={() => {}}
              >
                {uploadingActivity === activity
                  ? "Uploading..."
                  : "Upload File"}
              </button>
            </div>
          );
        })}
      </div>

      {message && (
        <div className="text-sm text-gray-800 bg-gray-100 p-3 rounded-lg border">
          {message}
        </div>
      )}

      <p className="text-xs text-gray-500">
        * Only mandatory documents will trigger supervisor notifications.
      </p>
    </div>
  );
}
