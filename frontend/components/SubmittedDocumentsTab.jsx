import { useEffect, useState } from "react";
import { apiGet, apiUpload } from "../utils/api";

const SECTIONS = [
  {
    title: "Basic Information & Registration",
    locked: true,
    items: [
      "Offer Letter",
      "Copy of Identity Card / Passport",
      "Registration Confirmation Form",
      "Student Profile (SMU)",
      "Degree Scroll and Academic Transcript (Entry Qualification)",
      "EMGS Support Letter",
      "LKM100 / LKM111",
      "TRX500",
    ],
  },
  {
    title: "Monitoring & Supervision",
    locked: false,
    items: [
      "Development Plan & Learning Contract (DPLC)",
      "Student Supervision Logbook",
      "Annual Progress Review Report – Year 1",
      "Annual Progress Review Report – Year 2",
      "Annual Progress Review Report – Year 3 (Final Year)",
    ],
  },
  {
    title: "Thesis & Examination",
    locked: false,
    items: [
      "Thesis Draft Submission Form",
      "Minutes of the Thesis Examination Panel Meeting",
      "Thesis Examination Panel Decision",
      "Thesis Examiners’ Reports",
      "Final Thesis Submission Form",
    ],
  },
];

export default function SubmittedDocumentsTab() {
  const [docs, setDocs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await apiGet("/api/documents/my");

        // SAFETY: backend must always return array, but UI must be defensive
        const list = Array.isArray(res) ? res : [];

        const map = {};
        list.forEach((r) => {
          if (r?.document_type) {
            map[r.document_type] = r;
          }
        });

        setDocs(map);
      } catch (err) {
        console.error("Failed to load documents:", err);
        setDocs({});
      } finally {
        setLoading(false); // ⬅️ NEVER get stuck
      }
    }

    loadDocuments();
  }, []);

  async function handleUpload(item, section, file) {
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("document_type", item);
    fd.append("section", section);

    const saved = await apiUpload("/api/documents/upload", fd);
    setDocs((prev) => ({ ...prev, [item]: saved }));
  }

  if (loading) {
    return <div className="text-gray-500">Loading documents…</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">📄 Submitted Documents</h2>

      {SECTIONS.map((sec) => (
        <div key={sec.title} className="bg-white rounded-xl shadow p-5">
          <h3 className="font-medium mb-3">
            {sec.title}
            {sec.locked && (
              <span className="ml-2 text-xs text-purple-600">(Locked)</span>
            )}
          </h3>

          <ul className="space-y-2">
            {sec.items.map((item) => {
              const doc = docs[item];

              return (
                <li
                  key={item}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <span className="text-sm">
                    {doc ? "✅" : "⬜"} {item}
                  </span>

                  {doc ? (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 text-xs font-medium"
                    >
                      View
                    </a>
                  ) : sec.locked ? (
                    <span className="text-xs text-gray-400">Auto</span>
                  ) : (
                    <label className="text-xs bg-purple-600 text-white px-3 py-1 rounded cursor-pointer">
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          handleUpload(item, sec.title, e.target.files[0])
                        }
                      />
                    </label>
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
