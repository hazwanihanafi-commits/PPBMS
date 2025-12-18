import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../utils/api";

const ITEMS = [
  "Development Plan & Learning Contract (DPLC)",
  "Student Supervision Logbook",
  "Annual Progress Review – Year 1",
  "Annual Progress Review – Year 2",
  "Annual Progress Review – Year 3 (Final Year)",
];

export default function StudentChecklist({ documents = {} }) {
  const [docs, setDocs] = useState(documents);
  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState(false);

  /* 🔁 ALWAYS reload from MasterTracking */
  async function reloadFromSheet() {
    const res = await apiGet("/api/student/me");
    setDocs(res.documents || {});
  }

  useEffect(() => {
    setDocs(documents);
  }, [documents]);

  function handleChange(label, value) {
    setInputs(prev => ({ ...prev, [label]: value }));
  }

  async function saveLink(label) {
    const url = inputs[label]?.trim();
    if (!url) {
      alert("Paste a link first");
      return;
    }

    setSaving(true);

    const res = await apiPost("/api/student/save-document", {
      document_type: label,   // MUST match backend DOC_COLUMN_MAP
      file_url: url
    });

    if (!res?.success) {
      alert("Save failed");
      setSaving(false);
      return;
    }

    /* 🔥 CRITICAL FIX */
    await reloadFromSheet();

    setInputs(prev => ({ ...prev, [label]: "" }));
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📁 Student Checklist</h3>

      {ITEMS.map(label => {
        const savedUrl = docs[label];

        return (
          <div key={label} className="border p-3 rounded bg-white">
            <div className="font-medium">{label}</div>

            {savedUrl ? (
              <a
                href={savedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-purple-600 underline text-sm"
              >
                View document
              </a>
            ) : (
              <div className="flex gap-2 mt-2">
                <input
                  type="url"
                  placeholder="Paste link here"
                  className="flex-1 border px-2 py-1 text-sm"
                  value={inputs[label] || ""}
                  onChange={e => handleChange(label, e.target.value)}
                />
                <button
                  onClick={() => saveLink(label)}
                  disabled={saving}
                  className="bg-purple-600 text-white px-3 rounded text-sm"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
