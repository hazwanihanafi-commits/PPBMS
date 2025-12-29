import { useEffect, useState } from "react";
import { API_BASE } from "@/utils/api";

/* =========================
   MASTER TRACKING COLUMNS
========================= */
const DOCUMENTS = [
  {
    section: "Monitoring & Supervision",
    label: "Development Plan & Learning Contract (DPLC)",
    key: "DPLC",
  },
  {
    section: "Monitoring & Supervision",
    label: "Student Supervision Logbook",
    key: "SUPERVISION_LOG",
  },
  {
    section: "Monitoring & Supervision",
    label: "Annual Progress Review – Year 1",
    key: "APR_Y1",
  },
  {
    section: "Monitoring & Supervision",
    label: "Annual Progress Review – Year 2",
    key: "APR_Y2",
  },
  {
    section: "Monitoring & Supervision",
    label: "Annual Progress Review – Year 3 (Final Year)",
    key: "APR_Y3",
  },

  { section: "Ethics & Publications", label: "Ethics Approval", key: "ETHICS_APPROVAL" },
  { section: "Ethics & Publications", label: "Publication Acceptance", key: "PUBLICATION_ACCEPTANCE" },
  { section: "Ethics & Publications", label: "Proof of Submission", key: "PROOF_OF_SUBMISSION" },
  { section: "Ethics & Publications", label: "Conference Presentation", key: "CONFERENCE_PRESENTATION" },

  { section: "Thesis & Viva", label: "Thesis Notice", key: "THESIS_NOTICE" },
  { section: "Thesis & Viva", label: "Viva Report", key: "VIVA_REPORT" },
  { section: "Thesis & Viva", label: "Correction Verification", key: "CORRECTION_VERIFICATION" },
  { section: "Thesis & Viva", label: "Final Thesis", key: "FINAL_THESIS" },
];

/* =========================
   COMPONENT
========================= */
export default function StudentChecklist({ initialDocuments = {} }) {
  const [documents, setDocuments] = useState({});
  const [inputs, setInputs] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  /* hydrate from backend */
  useEffect(() => {
    setDocuments(initialDocuments || {});
  }, [initialDocuments]);

  function handleChange(key, value) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  /* =========================
     SAVE / UPDATE DOCUMENT
  ========================== */
  async function saveLink(doc) {
    const url = inputs[doc.key]?.trim();
    if (!url) return alert("Paste a document link first.");

    setSavingKey(doc.key);
    const token = localStorage.getItem("ppbms_token");

    try {
      const res = await fetch(`${API_BASE}/api/student/save-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: doc.key,      // ✅ matches backend
          value: url,        // ✅ matches backend
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      setDocuments((prev) => ({ ...prev, [doc.key]: url }));
      setInputs((prev) => ({ ...prev, [doc.key]: "" }));
    } catch (e) {
      alert("Failed to save document");
    } finally {
      setSavingKey(null);
    }
  }

  /* =========================
     REMOVE DOCUMENT
  ========================== */
  async function removeLink(doc) {
    if (!confirm("Remove this document link?")) return;

    const token = localStorage.getItem("ppbms_token");

    try {
      const res = await fetch(`${API_BASE}/api/student/update-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: doc.key,
          value: "",
        }),
      });

      if (!res.ok) throw new Error("Remove failed");

      setDocuments((prev) => ({ ...prev, [doc.key]: "" }));
    } catch {
      alert("Failed to remove document");
    }
  }

  let currentSection = "";

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">📁 Student Checklist</h3>

      {DOCUMENTS.map((doc) => {
        const savedUrl = documents[doc.key];
        const showSection = doc.section !== currentSection;
        currentSection = doc.section;

        return (
          <div key={doc.key}>
            {showSection && (
              <h4 className="mt-4 mb-2 font-semibold text-purple-700">
                {doc.section}
              </h4>
            )}

            <div className="border p-3 rounded bg-white">
              <div className="font-medium mb-1">
                {savedUrl ? "✅" : "⬜"} {doc.label}
              </div>

              {savedUrl ? (
                <div className="flex gap-4 text-sm">
                  <a
                    href={savedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 underline"
                  >
                    View document
                  </a>
                  <button
                    onClick={() => removeLink(doc)}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <input
                    type="url"
                    placeholder="Paste link here"
                    className="flex-1 border px-2 py-1 text-sm rounded"
                    value={inputs[doc.key] || ""}
                    onChange={(e) =>
                      handleChange(doc.key, e.target.value)
                    }
                  />
                  <button
                    onClick={() => saveLink(doc)}
                    disabled={savingKey === doc.key}
                    className="bg-purple-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
