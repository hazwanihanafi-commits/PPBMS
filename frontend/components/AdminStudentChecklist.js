import { useState } from "react";
import { CHECKLIST_SECTIONS } from "./checklistConfig";
import { API_BASE } from "../utils/api";

export default function AdminStudentChecklist({ studentEmail, documents }) {
  const [inputs, setInputs] = useState({});
  const token = localStorage.getItem("ppbms_token");

  function handleChange(label, value) {
    setInputs((p) => ({ ...p, [label]: value }));
  }

  async function save(label) {
    const url = inputs[label];
    if (!url) return alert("Paste a link first");

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

    window.location.reload();
  }

  async function remove(label) {
    await fetch(`${API_BASE}/api/admin/save-document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        student_email: studentEmail,
        document_type: label,
        file_url: "",
      }),
    });

    window.location.reload();
  }

  return (
    <div className="space-y-8">
      {CHECKLIST_SECTIONS.map((section) => (
        <div key={section.title}>
          <h3 className="text-lg font-bold text-purple-700 mb-4">
            {section.title}
          </h3>

          {section.items.map((label) => {
            const saved = documents[label];

            return (
              <div
                key={label}
                className="bg-white border rounded-xl p-4 mb-3"
              >
                <div className="font-medium">
                  {saved ? "✅" : "⬜"} {label}
                </div>

                {saved ? (
                  <div className="flex gap-4 mt-2">
                    <a
                      href={saved}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 underline"
                    >
                      View document
                    </a>
                    <button
                      onClick={() => remove(label)}
                      className="text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="url"
                      placeholder="Paste link here"
                      className="flex-1 border px-2 py-1 text-sm"
                      onChange={(e) =>
                        handleChange(label, e.target.value)
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
