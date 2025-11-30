// frontend/pages/student/me.js
import { useEffect, useState } from "react";
import { calculateProgressWithTimeline } from "../../utils/calcProgress";
const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) { setError("Not logged in"); setLoading(false); return; }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API}/api/student/me`, { headers: { Authorization: `Bearer ${token}` }});
        const txt = await res.text();
        if (!res.ok) throw new Error(txt);
        const data = JSON.parse(txt);
        setRow(data.row);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [token, refreshFlag]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!row) return null;

  const programme = row.programme || "";
  const startDate = row.start_date || row.raw?.["Start Date"] || null;

  const { items, doneCount, total, percentage } = calculateProgressWithTimeline(row.raw || {}, programme, startDate);

  // toggle student tick — calls backend which writes to Google Sheet
  async function toggleTick(itemKey, setTo) {
    const token = localStorage.getItem("ppbms_token");
    try {
      const res = await fetch(`${API}/api/tasks/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentEmail: row.email, key: itemKey, value: setTo ? "TRUE" : "" })
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(txt);
      // refresh the student row
      setRefreshFlag(f => f + 1);
    } catch (e) {
      alert("Error updating tick: " + e.message);
    }
  }

  // Upload stub: sends a URL or uses file upload to backend
  async function uploadDocument(key) {
    const token = localStorage.getItem("ppbms_token");
    const docUrl = prompt("Paste document URL (or use upload implementation):");
    if (!docUrl) return;
    try {
      const res = await fetch(`${API}/api/tasks/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentEmail: row.email, key, url: docUrl })
      });
      if (!res.ok) throw new Error(await res.text());
      setRefreshFlag(f => f + 1);
    } catch (e) {
      alert("Upload failed: " + e.message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow">
        <h1 className="text-3xl font-bold">Student Progress</h1>
        <p className="mt-2 text-lg"><strong>{row.student_name}</strong> — {programme}</p>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className="col-span-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="font-semibold">{row.student_name}</div>
            <div className="text-sm text-gray-600">{programme}</div>
            <div className="mt-3 text-sm">
              <div><strong>Supervisor:</strong> {row.raw?.["Main Supervisor"] || "—"}</div>
              <div><strong>Email:</strong> {row.email}</div>
              <div><strong>Start Date:</strong> {startDate || "—"}</div>
            </div>
          </div>
        </div>

        <div className="col-span-8">
          <div className="bg-white p-4 rounded shadow">
            <div className="flex items-center gap-6">
              <div className="text-4xl font-bold">{percentage}%</div>
              <div className="text-gray-600">{doneCount} of {total} items completed</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow mt-4">
            <h3 className="font-semibold text-lg mb-4">Expected vs Actual</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-purple-600 text-white">
                  <tr>
                    <th className="p-2 text-left">Activity</th>
                    <th className="p-2">Expected</th>
                    <th className="p-2">Actual</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Remaining</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.key} className="border-b">
                      <td className="p-2">{it.label}</td>
                      <td className="p-2 text-center">{it.expected}</td>
                      <td className="p-2 text-center">{it.actual}</td>
                      <td className="p-2 text-center">{it.status}</td>
                      <td className="p-2 text-center">{it.remaining}</td>
                      <td className="p-2 text-center">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!it.done}
                            onChange={(e) => toggleTick(it.key, e.target.checked)}
                          />
                          { (it.key === "Development Plan & Learning Contract" || it.key === "Internal Evaluation Completed") && (
                            <button className="ml-2 px-2 py-1 bg-purple-600 text-white rounded" onClick={() => uploadDocument(it.key)}>Upload</button>
                          )}
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
