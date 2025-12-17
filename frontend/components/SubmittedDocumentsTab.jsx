import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../utils/api";

const SECTIONS = [
  {
    title: "📝 Monitoring & Supervision",
    items: [
      "Development Plan & Learning Contract (DPLC)",
      "Student Supervision Logbook",
      "Annual Progress Review – Year 1",
      "Annual Progress Review – Year 2",
      "Annual Progress Review – Year 3 (Final Year)",
    ],
  },
];

export default function SubmittedDocumentsTab() {
  const [docs, setDocs] = useState({});
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    const rows = await apiGet("/api/documents/my");

    const map = {};
    rows.forEach((r) => {
      map[r.document_type] = r;
    });

    setDocs(map);
    setLoading(false);
  }

  function normalizeUrl(url) {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  }

  async function saveLink(section, type) {
    const rawUrl = inputs[type]?.trim();
    if (!rawUrl) {
      alert("Please paste a document link.");
      return;
    }

    const url = normalizeUrl(rawUrl);

    const saved = await apiPost("/api/documents/save-link", {
      section,
      document_type: type,
      file_url: url,
    });

    setDocs((prev) => ({ ...prev, [type]: saved }));
    setInputs((prev) => ({ ...prev, [type]: "" }));
  }

  async function removeDocument(docId, type) {
    if (!confirm("Are you sure you want to remove this document?")) return;

    await apiPost("/api/documents/remove", {
      document_id: docId,
    });

    setDocs((prev) => {
      const copy = { ...prev };
      delete copy[type];
      return copy;
    });
  }

  if (loading) {
    return <div className="text-gray-500">Loading documents…</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">📄 Submitted Documents</h2>

      {SECTIONS.map((sec) => (
        <div key={sec.title} className="bg-white p-5 rounded-xl shadow">
          <h3 className="font-medium mb-4">{sec.title}</h3>

          <ul className="space-y-4">
            {sec.items.map((item) => {
              const doc = docs[item];

              return (
                <li key={item} className="border-b pb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      {doc ? "✅" : "⬜"} {item}
                    </span>

                    {doc && (
                      <div className="flex gap-4 text-xs">
                        {/* ✅ SAFE VIEW LINK */}
                        <a
                          href={normalizeUrl(doc.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </a>

                        <button
                          onClick={() =>
                            removeDocument(doc.document_id, item)
                          }
                          className="text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {!doc && (
                    <div className="flex gap-2 mt-3">
                      <input
                        type="url"
                        placeholder="Paste document link (https://...)"
                        value={inputs[item] || ""}
                        onChange={(e) =>
                          setInputs((prev) => ({
                            ...prev,
                            [item]: e.target.value,
                          }))
                        }
                        className="flex-1 border rounded px-3 py-1 text-sm"
                      />

                      <button
                        onClick={() => saveLink(sec.title, item)}
                        className="bg-purple-600 text-white px-4 py-1 rounded text-sm hover:opacity-90"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
