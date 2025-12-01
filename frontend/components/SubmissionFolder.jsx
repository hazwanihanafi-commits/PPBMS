// frontend/components/SubmissionFolder.jsx
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SubmissionFolder({ raw = {}, studentEmail, isSupervisor = false, onUpdated }) {
  // Keys that require upload (mandatory)
  const mandatoryKeys = [
    "Development Plan & Learning Contract",
    "Annual Progress Review (Year 1)",
    "Internal Evaluation Completed (Pre-Viva)",
    "Final Thesis Submission",
  ];

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleUpload(e, key) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const token = localStorage.getItem("ppbms_token");
      const form = new FormData();
      form.append("file", file);
      form.append("studentEmail", studentEmail);
      form.append("key", key);

      const res = await fetch(`${API}/api/tasks/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));
      if (onUpdated) onUpdated();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setUploading(false);
    }
  }

  async function handleToggle(key, actor) {
    setError(null);
    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(`${API}/api/tasks/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentEmail, key, actor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));
      if (onUpdated) onUpdated();
    } catch (e) {
      setError(e.message || String(e));
    }
  }

  async function handleExportPdf() {
    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(`${API}/api/tasks/exportPdf/${encodeURIComponent(studentEmail)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${studentEmail}_progress.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || String(e));
    }
  }

  return (
    <div>
      <h4 className="text-lg font-semibold mb-3">Submission Folder</h4>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="text-left bg-gray-100">
            <th className="p-2">Activity</th>
            <th className="p-2">Submitted</th>
            <th className="p-2">Student Date / Link</th>
            <th className="p-2">Supervisor Approved</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {mandatoryKeys.map((k) => {
            const submitted = raw[`${k}`] || raw[`${k} Submitted`] || "";
            const studentDate = raw[`${k} StudentTickDate`] || raw[`${k} Date`] || "";
            const submissionUrl = raw[`${k} Submission URL`] || "";
            const supApproved = raw[`${k} SupervisorApproved`] || "";
            return (
              <tr key={k} className="border-b">
                <td className="p-2 font-medium">{k}</td>
                <td className="p-2">{submitted ? "Yes" : "No"}</td>
                <td className="p-2">
                  <div className="text-sm">{studentDate || "—"}</div>
                  {submissionUrl && <a className="text-sm text-purple-600" href={submissionUrl} target="_blank" rel="noreferrer">View</a>}
                </td>
                <td className="p-2">{supApproved && String(supApproved).toLowerCase() === "true" ? "Approved" : "Pending"}</td>
                <td className="p-2">
                  {!isSupervisor && (
                    <>
                      <label className="inline-flex items-center gap-2 mr-3">
                        <input type="file" onChange={(e) => handleUpload(e, k)} />
                      </label>
                      <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => handleToggle(k, "student")} disabled={uploading}>
                        Mark Done
                      </button>
                    </>
                  )}
                  {isSupervisor && (
                    <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => handleToggle(k, "supervisor")}>
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleExportPdf}>Download PDF</button>
      </div>
    </div>
  );
}
