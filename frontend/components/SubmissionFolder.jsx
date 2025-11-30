// frontend/components/SubmissionFolder.jsx
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function SubmissionFolder({ raw = {}, studentEmail }) {
  const MANDATORY = [
    "Development Plan & Learning Contract",
    "Annual Progress Review (Year 1)",
    "Internal Evaluation Completed (Pre-Viva)",
    "Final Thesis Submission"
  ];

  const [loadingKey, setLoadingKey] = useState(null);
  const [msg, setMsg] = useState("");

  async function handleUpload(ev, key) {
    ev.preventDefault();
    const file = ev.target.file?.files[0];
    if (!file) { setMsg("Please choose a file"); return; }
    setLoadingKey(key);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("studentEmail", studentEmail);
    fd.append("key", key);

    try {
      const token = localStorage.getItem("ppbms_token");
      const res = await fetch(`${API}/api/tasks/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));
      setMsg(`Uploaded: ${key}`);
      // ideally refresh parent data afterwards
    } catch (e) {
      setMsg("Upload failed: " + (e.message || e));
    } finally {
      setLoadingKey(null);
    }
  }

  async function handleApprove(key) {
    const token = localStorage.getItem("ppbms_token");
    if (!token) { setMsg("Not authenticated"); return; }
    setLoadingKey(key);
    try {
      const res = await fetch(`${API}/api/tasks/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentEmail, key, actor: "supervisor" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));
      setMsg(`Approved ${key}`);
    } catch (e) {
      setMsg("Approve failed: " + (e.message || e));
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-lg font-semibold">Submission Folder</h4>
      {msg && <div className="text-sm text-gray-700">{msg}</div>}
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-600">
            <th>Document</th>
            <th>Uploaded</th>
            <th>Upload</th>
            <th>Supervisor</th>
          </tr>
        </thead>
        <tbody>
          {MANDATORY.map((k) => {
            const url = raw?.[`${k} Submission URL`] || raw?.[`${k} Submission`] || "";
            const stuDate = raw?.[k] || raw?.[`${k} Date`] || "";
            const supApproved = (raw?.[`${k} SupervisorApproved`] || "").toString().toLowerCase() === "true";
            return (
              <tr key={k} className="border-t">
                <td className="py-2">{k}</td>
                <td className="py-2 text-sm">{stuDate ? stuDate : <span className="text-gray-400">Not uploaded</span>}</td>
                <td className="py-2">
                  <form onSubmit={(e) => handleUpload(e, k)}>
                    <input name="file" type="file" className="mb-1" />
                    <button type="submit" disabled={loadingKey === k} className="ml-2 px-3 py-1 bg-purple-600 text-white rounded text-sm">
                      {loadingKey === k ? "Uploading…" : "Upload"}
                    </button>
                  </form>
                  {url && (
                    <a className="text-sm text-blue-600 block mt-1" target="_blank" rel="noreferrer" href={url}>View</a>
                  )}
                </td>
                <td className="py-2">
                  {supApproved ? (
                    <span className="text-green-700 font-semibold">Approved</span>
                  ) : (
                    <button onClick={() => handleApprove(k)} disabled={loadingKey === k} className="px-3 py-1 rounded bg-yellow-400 text-black text-sm">
                      {loadingKey === k ? "Approving…" : "Approve"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
