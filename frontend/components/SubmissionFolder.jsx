// frontend/components/SubmissionFolder.jsx
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SubmissionFolder({ raw = {}, studentEmail }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const mandatory = [
    "Development Plan & Learning Contract",
    "Annual Progress Review (Year 1)",
    "Internal Evaluation Completed (Pre-Viva)",
    "Final Thesis Submission"
  ];

  async function handleUpload(key) {
    if (!file) { setMessage("Select a file first"); return; }
    setUploading(true);
    const token = localStorage.getItem("ppbms_token");
    const form = new FormData();
    form.append("file", file);
    form.append("studentEmail", studentEmail);
    form.append("key", key);

    try {
      const res = await fetch(`${API}/api/tasks/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));
      setMessage(`Uploaded — ${key}`);
    } catch (e) {
      setMessage("Upload failed: " + e.message);
    } finally { setUploading(false); }
  }

  return (
    <div>
      <h4 className="text-lg font-semibold mb-2">Submission Folder (mandatory uploads)</h4>
      <div className="mb-3">
        <input type="file" onChange={(e) => setFile(e.target.files?.[0])} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mandatory.map((k) => (
          <div key={k} className="p-3 border rounded">
            <div className="font-medium">{k}</div>
            <div className="text-sm mb-2">
              Current: {raw[`${k} - FileURL`] ? <a className="text-purple-600" href={raw[`${k} - FileURL`]} target="_blank" rel="noreferrer">View</a> : "Not uploaded"}
            </div>
            <button
              onClick={() => handleUpload(k)}
              disabled={uploading}
              className="px-3 py-1 bg-purple-600 text-white rounded"
            >
              {uploading ? "Uploading…" : "Upload selected file"}
            </button>
          </div>
        ))}
      </div>
      {message && <div className="mt-3 text-sm text-gray-700">{message}</div>}
      <div className="mt-4 text-sm text-gray-500">Notes: Only mandatory files will be notified to supervisor on upload.</div>
    </div>
  );
}
