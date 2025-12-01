// components/SubmissionFolder.jsx
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SubmissionFolder({ studentEmail, keyName, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    if (!file) return alert("Choose a file");
    setUploading(true);
    try {
      const token = localStorage.getItem("ppbms_token");
      const form = new FormData();
      form.append("file", file);
      form.append("studentEmail", studentEmail);
      form.append("key", keyName);

      const res = await fetch(`${API}/api/tasks/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || j.message || "Upload failed");
      if (onUploaded) onUploaded();
      alert("Uploaded");
    } catch (e) {
      alert("Upload error: " + (e.message || e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input type="file" onChange={(e)=>setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={uploading} className="px-3 py-1 bg-purple-600 text-white rounded">
        {uploading ? "Uploading…" : "Upload"}
      </button>
    </div>
  );
}
