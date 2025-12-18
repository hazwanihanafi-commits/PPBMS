import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../utils/api";

const ITEMS = [
  "Development Plan & Learning Contract (DPLC)",
  "Student Supervision Logbook",
  "Annual Progress Review – Year 1",
  "Annual Progress Review – Year 2",
  "Annual Progress Review – Year 3 (Final Year)",
];

export default function SubmittedDocumentsTab() {
  const [docs, setDocs] = useState({});
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);

  /* ===============================
     LOAD SAVED LINKS FROM SHEET
  =============================== */
  async function loadDocs() {
    setLoading(true);
    const rows = await apiGet("/api/documents/my");

    const map = {};
    rows.forEach((r) => {
      map[r.document_type] = r;
    });

    setDocs(map);
    setLoading(false);
  }

  useEffect(() => {
    loadDocs();
  }, []);

  function onChange(item, value) {
    setInputs((prev) => ({ ...prev, [item]: value }));
  }

  /* ===============================
     SAVE / REPLACE LINK
  =============================== */
  async function saveLink(item) {
    const link = inputs[item]?.trim();
    if (!link) {
      alert("Paste a link first");
      return;
    }

    await apiPost("/api/documents/save-link", {
      document_type: item,
      file_url: link,
      section: "Monitoring & Supervision",
    });

    setInputs((prev) => ({ ...prev, [item]: "" }));
    loadDocs(); // 🔑 reload from sheet
  }

  /* ===============================
     REMOVE LINK
  =============================== */
  async function removeDoc(item) {
    if (!confirm("Remove this document?")) return;

    await apiPost("/api/documents/remove", {
      document_type: item,
    });

    loadDocs();
  }

  if (loading) return <p>Loading documents…</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📄 Submitted Documents</h3>

      {ITEMS.map((item) => {
        const doc = docs[item];

        return (
          <div
            key={item}
            className="border rounded-lg p-4 bg-white space-y-2"
          >
            <div className="font-medium">
              {doc ? "✅" : "⬜"} {item}
            </div>

            {/* VIEW / REMOVE */}
            {doc && (
              <div className="flex gap-4 text-sm">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-600 underline"
                >
                  View
                </a>

                <button
                  onClick={() => removeDoc(item)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
            )}

            {/* ALWAYS SHOW INPUT + SAVE */}
            <div className="flex gap-2 pt-1">
              <input
                type="url"
                value={inputs[item] || ""}
                onChange={(e) => onChange(item, e.target.value)}
                placeholder={
                  doc
                    ? "Paste new link to replace existing"
                    : "Paste document link (https://...)"
                }
                className="flex-1 border rounded px-2 py-1 text-sm"
              />

              <button
                onClick={() => saveLink(item)}
                className="bg-purple-600 text-white px-3 rounded text-sm"
              >
                Save
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
