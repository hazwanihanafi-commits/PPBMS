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
  "Thesis & Examination": [
    "Ethics Approval",
    "Publication Acceptance",
    "Proof of Submission",
    "Conference Presentation",
    "Thesis Notice",
    "Viva Report",
    "Correction Verification",
    "Final Thesis",
  ],
};

export default function AdminStudentChecklist({ studentEmail, documents }) {
  const [inputs, setInputs] = useState({});

  async function save(label) {
    const url = inputs[label];
    if (!url) return alert("Paste a link first");

    await fetch(`${API_BASE}/api/admin/save-document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
      },
      body: JSON.stringify({
        student_email: studentEmail,
        document_type: label,
        file_url: url,
      }),
    });

    location.reload();
  }

  async function remove(label) {
    if (!confirm("Remove document?")) return;

    await fetch(`${API_BASE}/api/admin/remove-document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
      },
      body: JSON.stringify({
        student_email: studentEmail,
        document_type: label,
      }),
    });

    location.reload();
  }

  return (
    <div className="space-y-6">
      {Object.entries(SECTIONS).map(([section, items]) => (
        <div key={section} className="bg-white border rounded-xl p-4">
          <h3 className="font-semibold mb-3">{section}</h3>

          {items.map(label => {
            const url = documents[label];

            return (
              <div key={label} className="border-b py-2">
                <div className="font-medium text-sm">{label}</div>

                {url ? (
                  <div className="flex gap-4 text-sm mt-1">
                    <a href={url} target="_blank" className="text-purple-600">
                      View
                    </a>
                    <button
                      onClick={() => remove(label)}
                      className="text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="url"
                      className="flex-1 border px-2 py-1 text-sm"
                      placeholder="Paste link"
                      onChange={e =>
                        setInputs(p => ({ ...p, [label]: e.target.value }))
                      }
                    />
                    <button
                      onClick={() => save(label)}
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
      ))}
    </div>
  );
}
