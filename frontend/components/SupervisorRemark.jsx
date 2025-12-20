import { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

export default function SupervisorRemark({
  studentMatric,
  studentEmail,
  assessmentType,
  initialRemark = ""
}) {
  const [remark, setRemark] = useState(initialRemark);
  const [status, setStatus] = useState("Saved");

  // 🔁 Load remark from backend when page loads / refreshes
  useEffect(() => {
    setRemark(initialRemark);
  }, [initialRemark]);

  // ⏱ Autosave after 1 second
  useEffect(() => {
    if (!remark) return;

    const timer = setTimeout(() => {
      saveRemark();
    }, 1000);

    return () => clearTimeout(timer);
  }, [remark]);

  async function saveRemark() {
    try {
      setStatus("Saving...");
      const token = localStorage.getItem("ppbms_token");

      console.log("SAVING REMARK:", {
        studentMatric,
        studentEmail,
        assessmentType,
        remark
      });

      const res = await fetch(`${API_BASE}/api/supervisor/remark`, {
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

      if (!res.ok) {
        throw new Error("Failed to save remark");
      }

      setStatus("Saved");
    } catch (e) {
      console.error("Remark save error:", e);
      setStatus("Error saving");
    }
  }

  return (
    <div className="bg-white rounded-xl p-4">
      <h3 className="font-semibold mb-2">
        🛠 Supervisor Intervention & Remarks ({assessmentType})
      </h3>

      <textarea
        className="w-full border rounded p-2 text-sm"
        rows={4}
        placeholder={`Supervisor intervention notes for ${assessmentType}...`}
        value={remark}
        onChange={e => setRemark(e.target.value)}
      />

      <p className="text-xs text-gray-500 mt-1">
        {status}
      </p>
    </div>
  );
}
