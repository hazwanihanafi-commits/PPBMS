import { useState } from "react";
import { API_BASE } from "../utils/api";
import { DOC_LABELS } from "../utils/docMap";

export default function AdminStudentChecklist({ studentEmail, documents }) {
  const [inputs, setInputs] = useState({});
  const token = localStorage.getItem("ppbms_token");

  async function save(label) {
    const url = inputs[label] || "";

    await fetch(`${API_BASE}/api/admin/save-document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        student_email: studentEmail,
        document_type: label,
        file_url: url,
      }),
    });

    alert("Saved. Refresh page.");
  }

  return (
    <div className="space-y-4">
      {DOC_LABELS.map(label => (
        <div key={label} className="border p-3 rounded bg-white">
          <div className="font-medium">{label}</div>

          {documents[label] ? (
            <div className="flex gap-4 text-sm">
              <a
                href={documents[label]}
                target="_blank"
                rel="noreferrer"
                className="text-purple-600 underline"
              >
                View
              </a>
              <button
                onClick={() => save(label)}
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
                onChange={e =>
                  setInputs({ ...inputs, [label]: e.target.value })
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
      ))}
    </div>
  );
}
