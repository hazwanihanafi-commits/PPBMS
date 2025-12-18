import { useState } from "react";
import { API_BASE } from "../utils/api";

const SECTIONS = [
  {
    title: "Monitoring & Supervision",
    items: [
      "Development Plan & Learning Contract (DPLC)",
      "Student Supervision Logbook",
      "Annual Progress Review – Year 1",
      "Annual Progress Review – Year 2",
      "Annual Progress Review – Year 3 (Final Year)",
    ],
  },
  {
    title: "Ethics & Publications",
    items: [
      "Ethics Approval",
      "Publication Acceptance",
      "Proof of Submission",
      "Conference Presentation",
    ],
  },
  {
    title: "Thesis & Viva",
    items: [
      "Thesis Notice",
      "Viva Report",
      "Correction Verification",
      "Final Thesis",
    ],
  },
];

export default function AdminStudentChecklist({ studentEmail, documents }) {
  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState(false);

  function handleChange(label, value) {
    setInputs((p) => ({ ...p, [label]: value }));
  }

  async function saveDoc(label, value = null) {
    setSaving(true);

    await fetch(`${API_BASE}/api/admin/save-document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
      },
      body: JSON.stringify({
        student_email: studentEmail,
        document_type: label,
        file_url: value,
      }),
    });

    window.location.reload(); // 🔥 force sync with MasterTracking
  }

  return (
    <div className="space-y-10">
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <h3 className="text-xl font-bold text-purple-700 mb-4">
            {section.title}
          </h3>

          <div className="space-y-4">
            {section.items.map((label) => {
              const saved = documents[label];

              return (
                <div
                  key={label}
                  className="bg-white border rounded-xl p-4"
                >
                  <div className="font-medium">{label}</div>

                  {saved ? (
                    <div className="flex gap-4 mt-2 text-sm">
                      <a
                        href={saved}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-700 underline"
                      >
                        View document
                      </a>

                      <button
                        onClick={() => saveDoc(label, "")}
                        className="text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3">
                      <input
                        type="url"
                        className="flex-1 border px-2 py-1 text-sm"
                        placeholder="Paste link here"
                        value={inputs[label] || ""}
                        onChange={(e) =>
                          handleChange(label, e.target.value)
                        }
                      />
                      <button
                        disabled={saving}
                        onClick={() =>
                          saveDoc(label, inputs[label])
                        }
                        className="bg-purple-600 text-white px-4 rounded"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
