import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";

const checklistItems = [
  "Development Plan & Learning Contract (DPLC)",
  "Student Supervision Logbook",
  "Annual Progress Review – Year 1",
  "Annual Progress Review – Year 2",
  "Annual Progress Review – Year 3 (Final Year)",
  "Ethics Approval",
  "Publication Acceptance",
  "Proof of Submission",
  "Conference Presentation",
  "Thesis Notice",
  "Viva Report",
  "Correction Verification",
  "Final Thesis",
];

export default function StudentChecklist({
  documents = {},
  onSaved,
}) {
  const [links, setLinks] = useState({});

  useEffect(() => {
    setLinks(documents || {});
  }, [documents]);

  async function saveDocument(name) {
    try {
      await authFetch("/api/student/save-document", {
        method: "POST",
        body: JSON.stringify({
          name,
          link: links[name] || "",
        }),
      });

      alert("Document saved");

      if (onSaved) {
        onSaved();
      }

    } catch (err) {
      console.error(err);
      alert("Failed to save document");
    }
  }

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-bold">
        📁 Student Checklist
      </h2>

      {checklistItems.map((item) => (
        <div
          key={item}
          className="bg-white rounded-2xl p-5 shadow border"
        >

          <h3 className="font-semibold text-lg mb-4">
            {item}
          </h3>

          <div className="flex gap-3">

            <input
              type="text"
              placeholder="Paste link here"
              value={links[item] || ""}
              onChange={(e) =>
                setLinks({
                  ...links,
                  [item]: e.target.value,
                })
              }
              className="flex-1 border rounded-xl px-4 py-3"
            />

            <button
              onClick={() => saveDocument(item)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-semibold"
            >
              Save
            </button>

          </div>

          {links[item] && (
            <a
              href={links[item]}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 underline mt-3 inline-block"
            >
              View Submitted Document
            </a>
          )}

        </div>
      ))}
    </div>
  );
}
