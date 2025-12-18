import { useEffect, useState } from "react";
import { apiPost } from "../utils/api";

/* MUST MATCH backend DOC_COLUMN_MAP KEYS */
const ITEMS = [
  "Development Plan & Learning Contract (DPLC)",
  "Student Supervision Logbook",
  "Annual Progress Review – Year 1",
  "Annual Progress Review – Year 2",
  "Annual Progress Review – Year 3 (Final Year)",
];

export default function SubmittedDocumentsTab({ documents = {} }) {
  const [inputs, setInputs] = useState({});

  function onChange(item, value) {
    setInputs((prev) => ({ ...prev, [item]: value }));
  }

  async function saveLink(item) {
    const link = inputs[item]?.trim();
    if (!link) {
      alert("Paste a link first");
      return;
    }

    try {
      await apiPost("/api/student/save-document", {
        document_type: item,
        file_url: link,
      });

      // reload page data (simple & reliable)
      window.location.reload();
    } catch (e) {
      alert("Save failed");
      console.error(e);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📄 Submitted Documents</h3>

      {ITEMS.map((item) => {
        const url = documents[item]; // 🔑 FROM MASTER TRACKING

        return (
          <div
            key={item}
            className="border rounded-lg p-3 bg-white space-y-2"
          >
            <div className="font-medium">
              {url ? "✅" : "⬜"} {item}
            </div>

            {url ? (
              <div className="flex gap-4 text-sm">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-600 underline"
                >
                  View
                </a>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={inputs[item] || ""}
                  onChange={(e) => onChange(item, e.target.value)}
                  placeholder="Paste document link (https://...)"
                  className="flex-1 border rounded px-2 py-1 text-sm"
                />
                <button
                  onClick={() => saveLink(item)}
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
