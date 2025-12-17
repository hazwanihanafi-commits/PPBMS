import { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

/**
 * Document definitions (same for Student & Supervisor)
 */
const DOCUMENTS = [
  {
    section: "Monitoring & Supervision",
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
  const [docs, setDocs] = useState([]);
  const [links, setLinks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocs();
  }, []);

  async function loadDocs() {
    try {
      const res = await fetch(`${API_BASE}/api/documents/my`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load documents", e);
      setDocs([]);
    }
    setLoading(false);
  }

  function getDoc(type) {
    return docs.find(
      (d) => d.document_type === type && d.status !== "removed"
    );
  }

  async function saveLink(section, type) {
    const url = links[type];
    if (!url) {
      alert("Paste a link first");
      return;
    }

    await fetch(`${API_BASE}/api/documents/save-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
      },
      body: JSON.stringify({
        section,
        document_type: type,
        file_url: url,
      }),
    });

    setLinks((p) => ({ ...p, [type]: "" }));
    loadDocs();
  }

  async function removeDoc(id) {
    if (!confirm("Remove this document?")) return;

    await fetch(`${API_BASE}/api/documents/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
      },
      body: JSON.stringify({ document_id: id }),
    });

    loadDocs();
  }

  if (loading) {
    return <p className="text-gray-500">Loading documents…</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">📄 Submitted Documents</h2>

      {DOCUMENTS.map((group) => (
        <div
          key={group.section}
          className="bg-white border rounded-2xl p-5 shadow"
        >
          <h3 className="font-semibold mb-4">{group.section}</h3>

          <ul className="space-y-3">
            {group.items.map((type) => {
              const doc = getDoc(type);

              return (
                <li
                  key={type}
                  className="border-b pb-3 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {doc ? "✅" : "⬜"} {type}
                    </span>

                    {doc && (
                      <div className="flex gap-4 text-sm">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600"
                        >
                          View
                        </a>
                        <button
                          onClick={() => removeDoc(doc.document_id)}
                          className="text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Paste link input */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste document link (https://...)"
                      value={links[type] || ""}
                      onChange={(e) =>
                        setLinks((p) => ({ ...p, [type]: e.target.value }))
                      }
                      className="flex-1 border rounded px-3 py-1 text-sm"
                    />
                    <button
                      onClick={() => saveLink(group.section, type)}
                      className="px-4 py-1 bg-purple-600 text-white rounded text-sm"
                    >
                      Save
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
