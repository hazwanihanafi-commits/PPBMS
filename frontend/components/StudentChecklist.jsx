import { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

/* 🔑 LABEL → MASTER TRACKING COLUMN */
const DOCUMENTS = [
  { label: "Development Plan & Learning Contract (DPLC)", key: "DPLC" },
  { label: "Student Supervision Logbook", key: "SUPERVISION_LOG" },
  { label: "Annual Progress Review – Year 1", key: "APR_Y1" },
  { label: "Annual Progress Review – Year 2", key: "APR_Y2" },
  { label: "Annual Progress Review – Year 3 (Final Year)", key: "APR_Y3" },

  { label: "Ethics Approval", key: "ETHICS_APPROVAL" },
  { label: "Publication Acceptance", key: "PUBLICATION_ACCEPTANCE" },
  { label: "Proof of Submission", key: "PROOF_OF_SUBMISSION" },
  { label: "Conference Presentation", key: "CONFERENCE_PRESENTATION" },
  { label: "Thesis Notice", key: "THESIS_NOTICE" },
  { label: "Viva Report", key: "VIVA_REPORT" },
  { label: "Correction Verification", key: "CORRECTION_VERIFICATION" },
  { label: "Final Thesis", key: "FINAL_THESIS" },
];

export default function StudentChecklist({ initialDocuments = {} }) {
  const [documents, setDocuments] = useState({});
  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState(false);

  /* hydrate from MasterTracking */
  useEffect(() => {
    setDocuments(initialDocuments || {});
  }, [initialDocuments]);

  function handleChange(key, value) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  async function saveLink(doc) {
    const url = inputs[doc.key]?.trim();
    if (!url) {
      alert("Paste a link first");
      return;
    }

    setSaving(true);

    const token = localStorage.getItem("ppbms_token");

    const res = await fetch(`${API_BASE}/api/student/save-document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        document_type: doc.label, // backend maps label → column
        file_url: url,
      }),
    });

    if (!res.ok) {
      alert("Save failed");
      setSaving(false);
      return;
    }

    /* update UI */
    setDocuments((prev) => ({
      ...prev,
      [doc.label]: url,
    }));

    setInputs((prev) => ({ ...prev, [doc.key]: "" }));
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📁 Student Checklist</h3>

      {DOCUMENTS.map((doc) => {
        const savedUrl = documents[doc.label];

        return (
          <div key={doc.key} className="border p-3 rounded bg-white">
            <div className="font-medium mb-1">{doc.label}</div>

            {savedUrl ? (
              <a
                href={savedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-purple-600 underline text-sm"
              >
                View document
              </a>
            ) : (
              <div className="flex gap-2 mt-2">
                <input
                  type="url"
                  placeholder="Paste link here"
                  className="flex-1 border px-2 py-1 text-sm"
                  value={inputs[doc.key] || ""}
                  onChange={(e) =>
                    handleChange(doc.key, e.target.value)
                  }
                />
                <button
                  onClick={() => saveLink(doc)}
                  disabled={saving}
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
