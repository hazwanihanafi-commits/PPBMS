// components/SubmissionFolder.jsx
import { useState } from "react";
import { ACTIVITIES_12 } from "../utils/calcProgress";

export default function SubmissionFolder({ raw = {}, onUpdate = null, studentEmail }) {
  // raw = row.raw from backend
  const [local, setLocal] = useState(() => {
    // build map of activity -> value (string)
    const map = {};
    ACTIVITIES_12.forEach(k => map[k] = raw[k] || "");
    return map;
  });

  const toggleActivity = async (key) => {
    // optimistic UI
    const newValue = local[key] ? "" : "tick"; // backend should accept 'tick' or real value
    const updated = { ...local, [key]: newValue };
    setLocal(updated);

    // call backend to persist tick if API exists
    try {
      await fetch(`/api/student/task/toggle`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ studentEmail, activityKey: key, value: newValue })
      });
      if (onUpdate) onUpdate(key, newValue);
    } catch (e) {
      console.warn("persist toggle failed", e);
    }
  };

  const uploadLinkFor = (key) => {
    // use sheet header naming convention: "Submission Document P1" etc.
    // Try to match mapping:
    if (key.startsWith("P1")) return raw["Submission Document P1"] || "";
    if (key.startsWith("P3")) return raw["Submission Document P3"] || "";
    if (key.startsWith("P4")) return raw["Submission Document P4"] || "";
    if (key.startsWith("P5")) return raw["Submission Document P5"] || "";
    // for other activities we may have dedicated fields, fallback:
    return raw["Submission Document Other"] || "";
  };

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold">Submission & Checklist</h4>

      <div className="grid gap-3">
        {ACTIVITIES_12.map((a) => (
          <div key={a} className="flex items-center justify-between p-3 bg-white rounded shadow-sm">
            <div>
              <div className="font-medium">{a}</div>
              <div className="text-xs text-gray-600">
                {local[a] ? "Completed" : "Not completed"}
                {uploadLinkFor(a) ? (
                  <> — <a className="text-purple-600 underline" target="_blank" rel="noreferrer" href={uploadLinkFor(a)}>View document</a></>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleActivity(a)}
                className={`px-3 py-1 rounded ${local[a] ? "bg-green-600 text-white" : "bg-gray-100"}`}
              >
                {local[a] ? "✓" : "Mark"}
              </button>

              <a
                className="text-sm px-3 py-1 border rounded hover:bg-gray-50 text-gray-700"
                href={`/student/upload?for=${encodeURIComponent(a)}&email=${encodeURIComponent(studentEmail)}`}
              >
                Upload
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
