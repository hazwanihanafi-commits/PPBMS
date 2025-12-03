import { useState } from "react";
import { API_BASE } from "../utils/api";

export default function SubmissionFolder({ raw, studentEmail }) {
  const [activity, setActivity] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  if (!raw) return null;

  // Auto-generate dropdown from activities containing "- Expected"
  const activities = Object.keys(raw)
    .filter((k) => k.includes("Exp: "))
    .map((k) => k.replace("Exp: ", ""));

  const uploadPDF = async () => {
    if (!activity) {
      setMessage("Please select activity.");
      return;
    }
    if (!file) {
      setMessage("Please upload PDF.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setMessage("File must be PDF.");
      return;
    }

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("studentEmail", studentEmail);
    formData.append("activity", activity);
    formData.append("file", file);

    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/tasks/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setMessage("Upload failed: " + data.error);
      return;
    }

    setMessage("Uploaded successfully!");
  };

  return (
    <div style={{ padding: 20, border: "1px solid #eee", borderRadius: 8 }}>
      <h3>Upload Document</h3>

      <label>Activity:</label>
      <select value={activity} onChange={(e) => setActivity(e.target.value)}>
        <option value="">-- Select --</option>
        {activities.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>

      <br /><br />

      <label>PDF File:</label>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={uploadPDF} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload PDF"}
      </button>

      {message && <p style={{ marginTop: 10, color: "red" }}>{message}</p>}
    </div>
  );
}
