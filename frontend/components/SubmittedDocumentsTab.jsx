import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../utils/api";

const SECTIONS = [
  {
    title: "Monitoring & Supervision",
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
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState({});

  useEffect(() => {
    loadDocs();
  }, []);

  async function loadDocs() {
    const rows = await apiGet("/api/documents/my");

    const map = {};
    rows.forEach((r) => {
      map[r.document_type] = r;
    });

    setDocs(map);
    setLoading(false);
  }

  async function saveLink(item, section) {
    const link = inputs[item];
    if (!link || !link.startsWith("http")) {
      alert("Please paste a valid link");
      return;
    }

    await apiPost("/api/documents/save-link", {
      document_type: item,
      section,
      file_url: link,
    });

    setInputs((p) => ({ ...p, [item]: "" }));
    loadDocs();
  }

  async function removeDoc(item) {
    if (!confirm("Remove this document?")) return;

    await apiPost("/api/documents/remove", {
      document_type: item,
    });

    loadDocs();
  }

  if (loading) return <div className="text-gray-500">Loading documents…</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">📄 Submitted Documents</h2>

      {SECTIONS.map((sec) => (
        <div key={sec.title} className="bg-white rounded-xl shadow p-5">
          <h3 className="font-medium mb-4">{sec.title}</h3>

          <ul className="space-y-3">
            {sec.items.map((item) => {
              const doc = docs[item];

              return (
                <li
                  key={item}
                  className="border-b pb-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {doc ? "✅" : "⬜"} {item}
                    </span>

                    {doc?.file_url && (
                      <div className="flex gap-3 text-sm">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 underline"
                        >
                          View
                        </a>

                        <button
                          onClick={() => removeDoc(item)}
                          className="text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {!doc && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste document link (https://...)"
                        className="flex-1 border rounded px-3 py-1 text-sm"
                        value={inputs[item] || ""}
                        onChange={(e) =>
                          setInputs((p) => ({
                            ...p,
                            [item]: e.target.value,
                          }))
                        }
                      />
                      <button
                        onClick={() => saveLink(item, sec.title)}
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
