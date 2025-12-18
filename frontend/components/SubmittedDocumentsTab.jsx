import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../utils/api";

const MAP = {
  "Development Plan & Learning Contract (DPLC)": "dplc",
  "Student Supervision Logbook": "supervision_log",
  "Annual Progress Review – Year 1": "apr1",
  "Annual Progress Review – Year 2": "apr2",
  "Annual Progress Review – Year 3 (Final Year)": "fpr3",
};

export default function SubmittedDocumentsTab() {
  const [docs, setDocs] = useState({});
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromMaster();
  }, []);

  async function loadFromMaster() {
    const res = await apiGet("/api/student/me");
    setDocs(res.row.documents || {});
    setLoading(false);
  }

  async function saveLink(label) {
    const link = inputs[label];
    if (!link) return alert("Paste link first");

    await apiPost("/api/documents/save-link", {
      document_type: label,
      file_url: link,
    });

    await loadFromMaster();
    setInputs((p) => ({ ...p, [label]: "" }));
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">📄 Submitted Documents</h3>

      {Object.keys(MAP).map((label) => {
        const key = MAP[label];
        const url = docs[key];

        return (
          <div key={label} className="border p-3 rounded bg-white">
            <div className="font-medium">
              {url ? "✅" : "⬜"} {label}
            </div>

            {url ? (
              <a
                href={url}
                target="_blank"
                className="text-purple-600 underline text-sm"
              >
                View
              </a>
            ) : (
              <div className="flex gap-2 mt-2">
                <input
                  className="border px-2 py-1 text-sm flex-1"
                  placeholder="Paste link"
                  value={inputs[label] || ""}
                  onChange={(e) =>
                    setInputs((p) => ({ ...p, [label]: e.target.value }))
                  }
                />
                <button
                  onClick={() => saveLink(label)}
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
