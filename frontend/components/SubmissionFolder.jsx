// frontend/components/SubmissionFolder.jsx
import { useState } from "react";
import { API_BASE } from "../utils/api";

export default function SubmissionFolder({ raw = {}, studentEmail }) {
  const [activity, setActivity] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  // derive activities from expected columns or actual pattern
  const activities = Object.keys(raw)
    .filter(k => k.endsWith(" - Actual"))
    .map(k => k.replace(" - Actual", ""));

  const handleUpload = async () => {
    if (!activity) return setMessage("Choose activity");
    if (!file) return setMessage("Choose PDF");
    if (!file.name.toLowerCase().endsWith(".pdf")) return setMessage("Only PDF allowed");

    setMessage("Uploading...");
    const form = new FormData();
    form.append("studentEmail", studentEmail);
    form.append("activity", activity);
    form.append("file", file);

    const token = localStorage.getItem("ppbms_token") || "";
    const res = await fetch(`${API_BASE}/tasks/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage("Upload failed: " + (data.error || JSON.stringify(data)));
      return;
    }

    setMessage("Uploaded successfully");
    // Optionally refresh page to show Actual date
  };

  return (
    <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
      <h4>Upload document</h4>

      <select value={activity} onChange={e => setActivity(e.target.value)}>
        <option value="">-- Select activity --</option>
        {activities.map(a => <option key={a} value={a}>{a}</option>)}
      </select>

      <div style={{ marginTop: 8 }}>
        <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} />
      </div>

      <button onClick={handleUpload} style={{ marginTop: 8 }}>Upload PDF</button>

      {message && <div style={{ marginTop: 8 }}>{message}</div>}
    </div>
  );
}
