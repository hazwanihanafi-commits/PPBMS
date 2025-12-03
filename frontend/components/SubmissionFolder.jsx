import { useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API_BASE?.trim() ||
  "https://ppbms.onrender.com";

export default function SubmissionFolder({ raw = {}, studentEmail, token }) {
  const [uploadingActivity, setUploadingActivity] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [message, setMessage] = useState("");

  // ----------------------------------------------------
  // File Select
  // ----------------------------------------------------
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessage("❌ Only PDF files are allowed.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setMessage("");
  };

  // ----------------------------------------------------
  // DATE-ONLY UPDATE (No PDF)
  // ----------------------------------------------------
  const handleSaveDateOnly = async () => {
    if (!uploadingActivity) {
      setMessage("❌ Please select an activity.");
      return;
    }
    if (!selectedDate) {
      setMessage("❌ Please select a date.");
      return;
    }

    try {
      const res = await fetch(`${API}/tasks/date-only`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentEmail,
          activity: uploadingActivity,
          date: selectedDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(`❌ Failed: ${data.error}`);
        return;
      }

      setMessage("✅ Date saved successfully!");
    } catch (err) {
      setMessage("❌ Error saving date: " + err.message);
    }
  };

  // ----------------------------------------------------
  // UPLOAD PDF FILE
  // ----------------------------------------------------
  const handleUpload = async () => {
    if (!uploadingActivity) {
      setMessage("❌ Please select an activity first.");
      return;
    }
    if (!selectedFile) {
      setMessage("❌ Please select a PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("activity", uploadingActivity);
    formData.append("studentEmail", studentEmail);

    setMessage("⏳ Uploading… please wait.");

    try {
      const res = await fetch(`${API}/tasks/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(`❌ Upload failed: ${data.error}`);
        return;
      }

      setMessage("✅ File uploaded & date updated successfully!");
      setSelectedFile(null);
    } catch (err) {
      setMessage("❌ Error uploading file: " + err.message);
    }
  };

  return (
    <div className="upload-box">
      <h3>📂 Upload Document / Save Date</h3>

      <label>Activity:</label>
      <select
        value={uploadingActivity}
        onChange={(e) => setUploadingActivity(e.target.value)}
      >
        <option value="">-- Select --</option>
        {Object.keys(raw)
          .filter((k) => k.endsWith("- FileURL"))
          .map((k) => {
            const activity = k.replace(" - FileURL", "");
            return (
              <option key={k} value={activity}>
                {activity}
              </option>
            );
          })}
      </select>

      {/* DATE PICKER */}
      <label>Select Date:</label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />

      <button onClick={handleSaveDateOnly}>💾 Save Date Only</button>

      <hr />

      {/* FILE UPLOAD */}
      <label>Choose PDF file:</label>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />

      <button onClick={handleUpload}>📤 Upload PDF</button>

      {message && <p>{message}</p>}
    </div>
  );
}
