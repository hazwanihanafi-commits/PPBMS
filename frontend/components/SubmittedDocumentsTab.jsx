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
  const [rows, setRows] = useState([]);
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await apiGet("/api/documents/my");
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function findDoc(type) {
    return rows.find(r => r.document_type === type);
  }

  async function saveLink(type) {
    const link = inputs[type]?.trim();
    if (!link) return alert("Paste a link first");

    await apiPost("/api/documents/save-link", {
      document_type: type,
      file_url: link,
      section: "Monitoring & Supervision",
    });

    setInputs(p => ({ ...p, [type]: "" }));
    load(); // 🔥 reload from backend
  }

  async function removeDoc(type) {
    if (!confirm("Remove this document?")) return;

    await apiPost("/api/documents/remove", { document_type: type });
    load(); // 🔥 reload from backend
  }

  if (loading) return <p>Loading documents…</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📄 Submitted Documents</h3>

      {ITEMS.map(type => {
        const doc = findDoc(type);

        return (
          <div key={type} className="border rounded-lg p-3 bg-white space-y-2">
            <div className="font-medium">
              {doc ? "✅" : "⬜"} {type}
            </div>

            {doc ? (
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
                  onClick={() => removeDoc(type)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={inputs[type] || ""}
                  onChange={e =>
                    setInputs(p => ({ ...p, [type]: e.target.value }))
                  }
                  placeholder="Paste document link (https://...)"
                  className="flex-1 border rounded px-2 py-1 text-sm"
                />
                <button
                  onClick={() => saveLink(type)}
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
