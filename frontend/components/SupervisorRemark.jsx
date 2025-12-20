import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";

export default function SupervisorRemark({
  studentMatric,
  studentEmail,
  assessmentType
}) {
  const [remark, setRemark] = useState("");
  const [status, setStatus] = useState("Saved");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (remark.trim() !== "") {
        saveRemark();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [remark]);

  async function saveRemark() {
    try {
      setStatus("Saving...");
      const token = localStorage.getItem("ppbms_token");

      await fetch(`${API_BASE}/api/supervisor/remark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentMatric,
          studentEmail,
          assessmentType,
          remark
        })
      });

      setStatus("Saved");
    } catch {
      setStatus("Error saving");
    }
  }

  return (
    <div className="bg-white rounded-xl p-4">
      <h3 className="font-semibold mb-2">
        🛠 Supervisor Intervention & Remarks
      </h3>

      <textarea
        className="w-full border rounded p-2 text-sm"
        rows={4}
        placeholder="Supervisor intervention notes..."
        value={remark}
        onChange={e => setRemark(e.target.value)}
      />

      <p className="text-xs text-gray-500 mt-1">
        {status}
      </p>
    </div>
  );
}
