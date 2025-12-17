// frontend/components/SubmittedDocumentsTab.jsx
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
  {
    title: "📘 Thesis & Examination",
    items: [
      "Thesis Draft Submission Form",
      "Examination Committee Minutes",
      "Thesis Examination Panel Decision",
      "Thesis Examiner Report",
      "Final Thesis Submission Form",
    ],
  },
];

export default function SubmittedDocumentsTab() {
  const [docs, setDocs] = useState({});
  const [linkInputs, setLinkInputs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    const rows = await apiGet("/api/documents/my");
    const map = {};
    rows.forEach((r) => {
      map[r.document_type] = r;
    });
    setDocs(map);
    setLoading(false);
  }

  async function saveLink(section, documentType) {
    const fileUrl = linkInputs[documentType];
    if (!fileUrl) {
      alert("Please paste a document link.");
      return;
    }

    const saved = await apiPost("/api/documents/save-link", {
      section,
      document_type: documentType,
      file_url: fileUrl,
    });

    setDocs((prev) => ({ ...prev, [documentType]: saved }));
    setLinkInputs((prev) => ({ ...prev, [documentType]: "" }));
  }

  async function removeDocument(documentId, documentType) {
    if (!confirm("Remove this document? This action can be restored by admin.")) {
      return;
    }

    await apiPost("/api/documents/remove", {
      document_id: documentId,
    });

    setDocs((prev) => {
      const copy = { ...prev };
      delete copy[documentType];
      return copy;
    });
  }

  if (loading) {
    return <div className="text-gray-500">Loading documents…</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">📄 Submitted Documents</h2>

      <p className="text-sm text-gray-600">
        Upload your document to Google Drive / JotForm / LMS, set access to
        <strong> “Anyone with the link – Viewer”</strong>, then paste the link
        below.
      </p>

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
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {doc ? "✅" : "⬜"} {item}
                    </span>

                    {doc && (
                      <div className="flex gap-3 text-xs">
                        <button
                          onClick={() => window.open(doc.file_url, "_blank")}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </button>

                        <button
                          onClick={() =>
                            removeDocument(doc.document_id, item)
                          }
                          className="text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* INPUT AREA */}
                  {!doc && (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Paste document link here"
                        value={linkInputs[item] || ""}
                        onChange={(e) =>
                          setLinkInputs((prev) => ({
                            ...prev,
                            [item]: e.target.value,
                          }))
                        }
                        className="flex-1 border rounded px-3 py-1 text-sm"
                      />

                      <button
                        onClick={() => saveLink(sec.title, item)}
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
