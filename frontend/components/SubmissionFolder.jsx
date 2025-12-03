// frontend/components/SubmissionFolder.jsx

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function SubmissionFolder({ raw, studentEmail, token }) {
  const [activity, setActivity] = useState("");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  const handleUpload = async () => {
    if (!activity) return setMsg("Please select an activity.");
    if (!file) return setMsg("Please select a PDF file.");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("activity", activity);
    fd.append("studentEmail", studentEmail);

    setMsg("Uploading...");

    try {
      const res = await fetch(`${API}/tasks/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: fd
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg("Upload failed: " + (data.error || "Unknown error"));
        return;
      }

      setMsg("PDF uploaded successfully ✓");
    } catch (e) {
      setMsg("Network error: " + e.message);
    }
  };

  return (
    <div>
      <h3>Upload Document</h3>

      <div>
        <label>Activity:</label>
        <select value={activity} onChange={(e) => setActivity(e.target.value)}>
          <option value="">Select activity</option>
          {Object.keys(raw).map((k) =>
            k.endsWith("FileURL") ? null : null
          )}
        </select>
      </div>

      <div>
        <label>PDF File:</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>

      <button onClick={handleUpload}>Upload PDF</button>

      {msg && <p style={{ marginTop: "10px" }}>{msg}</p>}
    </div>
  );
}
