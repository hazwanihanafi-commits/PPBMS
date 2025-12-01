// frontend/components/SubmissionFolder.jsx
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SubmissionFolder({ raw = {}, studentEmail }) {
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleDateSave(key, e) {
    const value = e.target.value; // YYYY-MM-DD
    try {
      setMsg("Saving...");
      const token = localStorage.getItem("ppbms_token");
      await fetch(`${API}/api/tasks/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentEmail, key, actor: "student", actualDate: value })
      });
      setMsg("Saved");
      setTimeout(() => setMsg(""), 2000);
      window.location.reload();
    } catch (err) {
      setMsg("Error saving");
      console.error(err);
    }
  }

  async function handleFileUpload(key, file) {
    const form = new FormData();
    form.append("file", file);
    form.append("studentEmail", studentEmail);
    form.append("key", key);

    try {
      setUploading(true);
      setMsg("Uploading...");
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(`${API}/api/tasks/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMsg("Uploaded");
      setTimeout(() => setMsg(""), 2000);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setMsg("Upload error");
    } finally {
      setUploading(false);
    }
  }

  async function handleSupervisorApprove(key) {
    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(`${API}/api/tasks/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentEmail, key, actor: "supervisor" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approve failed");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Approve failed: " + (err.message || ""));
    }
  }

  // Determine list to show: you can supply it or the page will map using raw keys.
  const keys = Object.keys(raw).filter(k => k && typeof k === "string");
  const monitorKeys = [
    "Development Plan & Learning Contract",
    "Annual Progress Review (Year 1)",
    "Annual Progress Review (Year 2)",
    "Internal Evaluation Completed (Pre-Viva)",
    "Final Thesis Submission"
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Submissions</h4>
      <div className="text-sm text-gray-600">Upload mandatory documents or set actual date here. Supervisor will be emailed on upload.</div>

      {monitorKeys.map((key) => {
        const actual = raw[key] || raw[`${key} Date`] || "";
        const approved = (raw[`${key} SupervisorApproved`] || "").toString().toLowerCase() === "true";
        const url = raw[`${key} Submission URL`] || "";
        return (
          <div key={key} className="p-3 border rounded flex items-center gap-4">
            <div className="flex-1">
              <div className="font-medium">{key}</div>
              <div className="text-xs text-gray-600">Actual: {actual || "—"} {approved && <span className="ml-2 text-green-700 font-semibold">Approved</span>}</div>
              {url && <a className="text-sm text-purple-600" target="_blank" rel="noreferrer" href={url}>View uploaded document</a>}
            </div>

            <div className="flex items-center gap-2">
              <input type="date" defaultValue={actual || ""} onBlur={(e) => handleDateSave(key, e)} className="border p-1 rounded text-sm" />
              <label className="text-xs">Upload</label>
              <input type="file" onChange={(e) => e.target.files[0] && handleFileUpload(key, e.target.files[0])} />
              <button onClick={() => handleSupervisorApprove(key)} className="px-3 py-1 bg-purple-600 text-white rounded text-sm" disabled={approved}>Approve</button>
            </div>
          </div>
        );
      })}

      {msg && <div className="text-sm text-gray-600 mt-2">{msg}</div>}
    </div>
  );
}
