import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../utils/api";

/**
 * Document definitions
 * key MUST match backend COLUMN_MAP
 */
const DOCUMENTS = [
  {
    key: "dplc",
    label: "Development Plan & Learning Contract (DPLC)",
  },
  {
    key: "apr1",
    label: "Annual Progress Review – Year 1",
  },
  {
    key: "apr2",
    label: "Annual Progress Review – Year 2",
  },
  {
    key: "fpr3",
    label: "Annual Progress Review – Year 3 (Final Year)",
  },
];

export default function SubmittedDocumentsTab() {
  const [documents, setDocuments] = useState({});
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);

  /* ============================================================
      LOAD FROM /api/student/me (MASTERTRACKING)
     ============================================================ */
  useEffect(() => {
    async function load() {
      try {
        const res = await apiGet("/api/student/me");
        setDocuments(res.row?.documents || {});
      } catch (e) {
        console.error("Failed to load documents", e);
      }
      setLoading(false);
    }

    load();
  }, []);

  /* ============================================================
      SAVE LINK → MASTERTRACKING
     ============================================================ */
  async function saveLink(key) {
    const url = (inputs[key] || "").trim();
    if (!url) {
      alert("Paste a document link first");
      return;
    }

    await apiPost("/api/student/save-document", {
      key,
      url,
    });

    // update UI immediately
    setDocuments((prev) => ({ ...prev, [key]: url }));
    setInputs((prev) => ({ ...prev, [key]: "" }));
  }

  if (loading) return <p className="text-gray-500">Loading documents…</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📄 Submitted Documents</h3>

      {DOCUMENTS.map(({ key, label }) => {
        const url = documents[key];

        return (
          <div
            key={key}
            className="border rounded-lg p-3 bg-white space-y-2"
          >
            <div className="font-medium">
              {url ? "✅" : "⬜"} {label}
            </div>

            {url ? (
              <div className="flex gap-3 text-sm">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 underline"
                >
                  View
                </a>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={inputs[key] || ""}
                  onChange={(e) =>
                    setInputs((p) => ({ ...p, [key]: e.target.value }))
                  }
                  placeholder="Paste document link (https://...)"
                  className="flex-1 border rounded px-2 py-1 text-sm"
                />

                <button
                  onClick={() => saveLink(key)}
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
