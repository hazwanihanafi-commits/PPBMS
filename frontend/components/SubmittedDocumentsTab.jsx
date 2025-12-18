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

  /* =========================
     LOAD FROM MASTER TRACKING
  ========================= */
  async function load() {
    const res = await apiGet("/api/student/me");
    setDocs(res.row.documents || {});
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(item) {
    const link = inputs[item]?.trim();
    if (!link) return alert("Paste link first");

    await apiPost("/api/student/save-document", {
      document_type: item,
      file_url: link,
    });

    await load(); // 🔑 reload from sheet
    setInputs(prev => ({ ...prev, [item]: "" }));
  }

  if (loading) return <p>Loading documents…</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📄 Student Checklist</h3>

      {ITEMS.map(item => {
        const url = docs[item];
        const submitted = typeof url === "string" && url.trim() !== "";

        return (
          <div key={item} className="border rounded p-3 bg-white space-y-2">
            <div className="font-medium">
              {submitted ? "✅" : "⬜"} {item}
            </div>

            {submitted ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-purple-600 underline"
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
