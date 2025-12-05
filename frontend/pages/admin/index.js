import { useState, useEffect } from "react";
import { API_BASE } from "../../utils/api";

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch all students
  async function loadStudents() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/all-students`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("ppbms_token")}` },
      });

      const json = await res.json();
      if (res.ok) setStudents(json.students || []);
      else setMessage(json.error || "Failed to fetch students");
    } catch {
      setMessage("Unable to load students");
    }
    setLoading(false);
  }

  // Reset cache
  async function resetCache() {
    try {
      const res = await fetch(`${API_BASE}/admin/reset-cache`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("ppbms_token")}` },
      });

      const json = await res.json();
      setMessage(json.message || "Cache reset");
    } catch {
      setMessage("Failed to reset cache");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-10">

      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-5xl font-extrabold text-purple-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-3 text-lg max-w-3xl">
          Welcome to the PPBMS Admin Panel. Manage programmes, cohorts, supervisors, 
          and student progress.
        </p>
      </div>

      {/* SYSTEM TOOLS CARD */}
      <div className="bg-white shadow-card rounded-2xl p-8 border border-gray-100 max-w-3xl">

        <h2 className="text-2xl font-bold text-gray-900 mb-4">System Tools</h2>

        <ul className="space-y-4 text-gray-700 text-lg">
          <li className="flex items-center gap-3">
            <span className="text-purple-600 text-xl">📄</span>
            <button
              className="hover:text-purple-700 hover:underline"
              onClick={loadStudents}
            >
              View all students from Google Sheet
            </button>
          </li>

          <li className="flex items-center gap-3">
            <span className="text-purple-600 text-xl">⚠️</span>
           
