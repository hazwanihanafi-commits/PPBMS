import { useEffect, useState } from "react";
import { STUDENT_CHECKLIST } from "../src/config/studentChecklist";
import { API_BASE } from "../utils/api";

export default function ChecklistPage() {
  const [data, setData] = useState({});
  const [role, setRole] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch(`${API_BASE}/api/checklist`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
      },
    });

    const json = await res.json();
    setData(json.checklist || {});
    setRole(json.role || "");
  }

  async function saveLink(key, link) {
    if (!link) return;

    await fetch(`${API_BASE}/api/documents/save-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
      },
      body: JSON.stringify({
        document_type: key,
        file_url: link,
      }),
    });

    load();
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">📂 Student Checklist</h2>

      {STUDENT_CHECKLIST.map((sec) => (
        <div key={sec.section} className="mb-6">
          <h3 className="font-semibold text-purple-700 mb-2">
            {sec.section}
          </h3>

          {sec.items.map((item) => (
            <div key={item.key} className="mb-2">
              <div className="font-medium">{item.label}</div>

              {data[item.key] ? (
                <a
                  href={data[item.key]}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  🔗 View submitted document
                </a>
              ) : (
                <span className="text-gray-500 text-sm">
                  Not submitted
                </span>
              )}

              <input
                type="text"
                placeholder="Paste link here"
                className="border rounded px-2 py-1 text-sm w-full mt-1"
                onBlur={(e) => saveLink(item.key, e.target.value)}
              />

              {role === "supervisor" && (
                <div className="text-xs text-gray-500">
                  Uploaded as supervisor
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
