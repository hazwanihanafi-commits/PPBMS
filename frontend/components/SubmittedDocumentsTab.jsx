import { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

/**
 * Canonical document structure (UI only)
 * These labels are DISPLAY labels, NOT matching keys
 */
const DOCUMENT_SECTIONS = [
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
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/documents/my`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load documents failed", err);
      setDocs([]);
    }
    setLoading(false);
  }

  /**
   * VERY IMPORTANT:
   * We do NOT rely on exact document_type matching.
   * We find the latest document in the SAME SECTION
   * whose document_type CONTAINS the label keywords.
   */
  function findDocument(section, label) {
    const labelKey = label.toLowerCase();

    const matches = docs.filter(
      (d) =>
        (d.section || "").toLowerCase() === section.toLowerCase() &&
        (d.document_type || "").toLowerCase().includes(labelKey)
    );

    if (matches.length === 0) return null;

    // Return the latest uploaded
    return matches[matches.length - 1];
  }

  async function saveLink(section, label) {
    const url = links[label];
    if (!url) {
      alert("Please paste a document link first");
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
        document_type: label,
        file_url: url,
      }),
    });

    setLinks((prev) => ({ ...prev, [label]: "" }));
    loadDocs();
  }

  async function removeDoc(documentId) {
    if (!confirm("Remove this document?")) return;

    await fetch(`${API_BASE}/api/documents/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
      },
      body: JSON.stringify({ document_id: documentId }),
    });

    loadDocs();
  }

  if (loading) {
    return <p className="text-gray-500">Loading documents…</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">📄 Submitted Documents</h2>

      {DOCUMENT_SECTIONS.map((group) => (
        <div
          key={group.section}
          className="bg-white border rounded-2xl p-5 shadow"
        >
          <h3 className="font-semibold mb-4">{group.section}</h3>

          <ul className="space-y-4">
            {group.items.map((label) => {
              const doc = findDocument(group.section, label);

              return (
                <li
                  key={label}
                  className="border-b pb-4 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {doc ? "✅" : "⬜"} {label}
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

                  {/* Paste link */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste document link (https://...)"
                      value={links[label] || ""}
                      onChange={(e) =>
                        setLinks((prev) => ({
                          ...prev,
                          [label]: e.target.value,
                        }))
                      }
                      className="flex-1 border rounded px-3 py-1 text-sm"
                    />
                    <button
                      onClick={() => saveLink(group.section, label)}
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
