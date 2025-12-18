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

  useEffect(() => {
    apiGet("/api/student/me").then(res => {
      setDocs(res.row.documents || {});
      setLoading(false);
    });
  }, []);

  async function save(item) {
    const link = inputs[item]?.trim();
    if (!link) return alert("Paste link first");

    await apiPost("/api/student/save-document", {
      document_type: item,
      file_url: link,
    });

    setDocs(prev => ({ ...prev, [item]: link }));
    setInputs(prev => ({ ...prev, [item]: "" }));
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📄 Student Checklist</h3>

      {ITEMS.map(item => {
        const url = docs[item];
        const hasDoc = typeof url === "string" && url.trim().length > 0;

        return (
          <div key={item} className="border rounded p-3 bg-white space-y-2">
            <div className="font-medium">
              {hasDoc ? "✅" : "⬜"} {item}
            </div>

            {hasDoc ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-purple-600 underline inline-block"
              >
                View document
              </a>
            ) : (
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded px-2 py-1"
                  placeholder="Paste link here"
                  value={inputs[item] || ""}
                  onChange={e =>
                    setInputs(p => ({ ...p, [item]: e.target.value }))
                  }
                />
                <button
                  onClick={() => save(item)}
                  className="bg-purple-600 text-white px-3 rounded"
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
