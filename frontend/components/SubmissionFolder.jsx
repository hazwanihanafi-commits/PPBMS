// frontend/components/SubmissionFolder.jsx
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SubmissionFolder({ raw = {}, studentEmail, token }) {
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadingActivity, setUploadingActivity] = useState("");
  const [message, setMessage] = useState("");

  const mandatoryUploads = [
    "Development Plan & Learning Contract",
    "Annual Progress Review (Year 1)",
    "Annual Progress Review (Year 2)",
    "Final Thesis Submission",
  ];

  async function uploadFile(activity) {
    const file = selectedFiles[activity];
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

      setMessage(`✅ Successfully uploaded: ${activity}`);

      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      setMessage("❌ Upload failed: " + err.message);
    }

    setUploadingActivity("");
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-purple-700">📁 Submission Folder</h3>

      <p className="text-sm text-gray-600">
        Uploads here will automatically update Google Sheets and notify your supervisor.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mandatoryUploads.map((activity) => {
          const url = raw[`${activity} - FileURL`];
          const hasFile = Boolean(url);

          return (
            <div key={activity} className="p-5 rounded-xl bg-white border shadow-md">
              {/* Title */}
              <div className="font-bold text-purple-700 mb-1">{activity}</div>

              {/* Status */}
              <div className="mb-2 text-xs">
                {hasFile ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-700 underline"
                  >
                    ✔ File Uploaded — View
                  </a>
                ) : (
                  <span className="text-red-500">✖ No file uploaded</span>
                )}
              </div>

              {/* File selector */}
              <input
                type="file"
                className="w-full text-xs mb-3"
                onChange={(e) =>
                  setSelectedFiles((prev) => ({
                    ...prev,
                    [activity]: e.target.files?.[0],
                  }))
                }
              />

              {/* Upload button */}
              <button
                className={`w-full py-2 text-sm rounded-lg text-white 
                ${
                  uploadingActivity === activity
                    ? "bg-gray-400"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
                disabled={uploadingActivity === activity}
                onClick={() => uploadFile(activity)}
              >
                {uploadingActivity === activity ? "Uploading…" : "Upload File"}
              </button>
            </div>
          );
        })}
      </div>

      {message && (
        <div className="p-3 bg-gray-100 border rounded text-sm">{message}</div>
      )}

      <p className="text-xs text-gray-500">
        * Only mandatory documents will trigger supervisor notifications.
      </p>
    </div>
  );
}
