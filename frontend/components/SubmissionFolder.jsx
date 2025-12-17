import { useState } from "react";
import { apiUpload } from "../utils/api";

export default function SubmissionFolder({ studentEmail }) {
  const [activity, setActivity] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const activities = [
    "Development Plan & Learning Contract (DPLC)",
    "Annual Progress Review Report – Year 1",
    "Annual Progress Review Report – Year 2",
    "Annual Progress Review Report – Year 3 (Final Year)",
  ];

  const handleUpload = async () => {
    if (!activity) return setMessage("Choose document");
    if (!file) return setMessage("Choose PDF");
    if (!file.name.toLowerCase().endsWith(".pdf"))
      return setMessage("Only PDF allowed");

    setMessage("Uploading...");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("document_type", activity);
    fd.append("section", "Monitoring & Supervision");

    try {
      await apiUpload("/api/documents/upload", fd);
      setMessage("Uploaded successfully");
    } catch (err) {
      console.error(err);
      setMessage("Upload failed");
    }
  };

  return (
    <div className="p-4 border rounded">
      <h4 className="font-semibold mb-2">Upload Document</h4>

      <select
        value={activity}
        onChange={(e) => setActivity(e.target.value)}
        className="border p-1 mb-2 w-full"
      >
        <option value="">-- Select document --</option>
        {activities.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-2"
      />

      <button
        onClick={handleUpload}
        className="bg-purple-600 text-white px-3 py-1 rounded"
      >
        Upload PDF
      </button>

      {message && <div className="mt-2 text-sm">{message}</div>}
    </div>
  );
}
