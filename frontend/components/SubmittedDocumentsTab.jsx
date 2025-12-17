import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../utils/api";

const ITEMS = [
  "Development Plan & Learning Contract (DPLC)",
  "Student Supervision Logbook",
  "Annual Progress Review – Year 1",
  "Annual Progress Review – Year 2",
  "Annual Progress Review – Year 3 (Final Year)",
];

function normalizeKey(str) {
  return str.replace(/–/g, "-").replace(/\s+/g, " ").trim();
}

export default function SubmittedDocumentsTab() {
  const [docs, setDocs] = useState({});
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/api/documents/my").then((rows) => {
      const map = {};
      rows.forEach((r) => {
        map[normalizeKey(r.document_type)] = r;
      });
      setDocs(map);
      setLoading(false);
    });
  }, []);

  function onChange(item, value) {
    setInputs((p) => ({ ...p, [item]: value }));
  }

  async function saveLink(item) {
    const link = inputs[item]?.trim();
    if (!link) return alert("Paste a link first");

    const saved = await apiPost("/api/documents/save-link", {
      document_type: normalizeKey(item),
      file_url: link,
      section: "Monitoring & Supervision",
    });

    setDocs((p) => ({ ...p, [normalizeKey(item)]: saved }));
    setInputs((p) => ({ ...p, [item]: "" }));
  }

  async function removeDoc(item) {
    if (!confirm("Remove this document?")) return;

    await apiPost("/api/documents/remove", {
      document_type: normalizeKey(item),
    });

    setDocs((p) => {
      const c = { ...p };
      delete c[normalizeKey(item)];
      return c;
    });
  }

  if (loading) return <p>Loading documents…</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📄 Submitted Documents</h3>

      {ITEMS.map((item) => {
        const doc = docs[normalizeKey(item)];

        return (
          <div key={item} className="border rounded-lg p-3 bg-white space-y-2">
            <div className="font-medium">
              {doc ? "✅" : "⬜"} {item}
            </div>

            {doc ? (
              <div className="flex gap-3 text-sm">
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
