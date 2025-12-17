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
    load();
  }, []);

  async function load() {
    const rows = await apiGet("/api/documents/my");
    const map = {};
    rows.forEach((r) => {
      map[r.document_type] = r;
    });
    setDocs(map);
    setLoading(false);
  }

  /** 🔒 HARD URL NORMALISER */
  function safeUrl(raw) {
    if (!raw) return null;

    // Remove whitespace + newlines
    const trimmed = raw.toString().trim();

    if (!trimmed) return null;

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return encodeURI(trimmed);
    }

    return encodeURI(`https://${trimmed}`);
  }

  async function save(section, type) {
    const raw = inputs[type];
    const url = safeUrl(raw);

    if (!url) {
      alert("Please paste a valid document link.");
      return;
    }

    const saved = await apiPost("/api/documents/save-link", {
      section,
      document_type: type,
      file_url: url,
    });

    setDocs((p) => ({ ...p, [type]: saved }));
    setInputs((p) => ({ ...p, [type]: "" }));
  }

  async function remove(docId, type) {
    if (!confirm("Remove this document?")) return;

    await apiPost("/api/documents/remove", { document_id: docId });

    setDocs((p) => {
      const c = { ...p };
      delete c[type];
      return c;
    });
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">📄 Submitted Documents</h2>

      {SECTIONS.map((sec) => (
        <div key={sec.title} className="bg-white p-5 rounded-xl shadow">
          <h3 className="font-medium mb-4">{sec.title}</h3>

          <ul className="space-y-4">
            {sec.items.map((item) => {
              const doc = docs[item];
              const viewUrl = safeUrl(doc?.file_url);

              // 🔍 DEBUG (REMOVE LATER)
              if (doc && !viewUrl) {
                console.warn("Invalid URL detected:", doc.file_url);
              }

              return (
                <li key={item} className="border-b pb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      {doc ? "✅" : "⬜"} {item}
                    </span>

                    {viewUrl && (
                      <div className="flex gap-4 text-xs">
                        <a
                          href={viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </a>

                        <button
                          onClick={() => remove(doc.document_id, item)}
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
                        type="text"
                        placeholder="Paste document link (https://...)"
                        value={inputs[item] || ""}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            [item]: e.target.value,
                          }))
                        }
                        className="flex-1 border rounded px-3 py-1 text-sm"
                      />

                      <button
                        onClick={() => save(sec.title, item)}
                        className="bg-purple-600 text-white px-4 py-1 rounded text-sm"
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
