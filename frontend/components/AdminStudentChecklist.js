import { useState } from "react";
import { API_BASE } from "../utils/api";

const SECTIONS = {
  "Monitoring & Supervision": [
    "Development Plan & Learning Contract (DPLC)",
    "Student Supervision Logbook",
    "Annual Progress Review – Year 1",
    "Annual Progress Review – Year 2",
    "Annual Progress Review – Year 3 (Final Year)",
  ],
  "Ethics & Publications": [
    "Ethics Approval",
    "Publication Acceptance",
    "Proof of Submission",
    "Conference Presentation",
  ],
  "Thesis & Viva": [
    "Thesis Notice",
    "Viva Report",
    "Correction Verification",
    "Final Thesis",
  ],
};

export default function AdminStudentChecklist({ studentEmail, documents }) {
  const [inputs, setInputs] = useState({});

  async function save(doc) {
    await fetch(`${API_BASE}/api/admin/save-document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
      },
      body: JSON.stringify({
        student_email: studentEmail,
        document_type: doc,
        file_url: inputs[doc] || ""
      })
    });
    location.reload();
  }

  async function remove(doc) {
    if (!confirm("Remove this document?")) return;
    await save(doc);
  }

  return (
    <div className="space-y-8">
      {Object.entries(SECTIONS).map(([section, items]) => (
        <div key={section}>
          <h3 className="text-lg font-bold text-purple-700 mb-4">{section}</h3>

          {items.map(doc => (
            <div key={doc} className="bg-white border rounded p-4 mb-3">
              {documents[doc] ? (
                <>
                  <div className="font-semibold">✅ {doc}</div>
                  <a
                    href={documents[doc]}
                    target="_blank"
                    className="text-purple-600 underline mr-4"
                  >
                    View document
                  </a>
                  <button
                    onClick={() => remove(doc)}
                    className="text-red-600"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <div className="font-semibold">⬜ {doc}</div>
                  <input
                    className="border px-2 py-1 w-full mt-2"
                    placeholder="Paste link here"
                    onChange={e =>
                      setInputs({ ...inputs, [doc]: e.target.value })
                    }
                  />
                  <button
                    onClick={() => save(doc)}
                    className="mt-2 bg-purple-600 text-white px-4 py-1 rounded"
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
