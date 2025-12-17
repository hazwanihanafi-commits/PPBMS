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
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);

  async function loadDocs() {
    const rows = await apiGet("/api/documents/my");

    // 🔑 CRITICAL FIX: array → map
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

  async function saveLink(item, section) {
    const link = inputs[item];
    if (!link) return alert("Paste a link first");

    await apiPost("/api/documents/save-link", {
      document_type: item,
      section,
      file_url: link,
    });

    setInputs((p) => ({ ...p, [item]: "" }));
    loadDocs();
  }

  async function removeDoc(item) {
    await apiPost("/api/documents/remove", {
      document_type: item,
    });
    loadDocs();
  }

  if (loading) return <div>Loading documents…</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">📄 Submitted Documents</h2>

      {SECTIONS.map((sec) => (
        <div key={sec.title} className="bg-white rounded-xl p-5 shadow">
          <h3 className="font-semibold mb-4">{sec.title}</h3>

          {sec.items.map((item) => {
            const doc = docs[item];

            return (
              <div
                key={item}
                className="border-b py-3 flex flex-col gap-2"
              >
                <div className="font-medium">
                  {doc ? "✅" : "⬜"} {item}
                </div>

                {doc ? (
                  <div className="flex gap-3">
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
                      className="text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
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
                      className="border rounded px-3 py-1 flex-1"
                    />

                    <button
                      onClick={() => saveLink(item, sec.title)}
                      className="bg-purple-600 text-white px-4 rounded"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
