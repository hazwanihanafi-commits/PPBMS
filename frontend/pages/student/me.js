import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function StudentDashboard() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load token
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      window.location.href = "/login";
      return;
    }
    setToken(t);
  }, []);

  // Fetch student data
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const r = await fetch(`${API}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!r.ok) throw new Error(await r.text());

        const data = await r.json();
        setRow(data.row);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading)
    return <div className="p-10 text-center text-gray-500 text-lg">Loading…</div>;

  if (error)
    return (
      <div className="p-10 text-center text-red-500 text-lg">
        Failed to load data<br />{error}
      </div>
    );

  if (!row) return null;

  // Progress calculation
  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <header className="mb-10 max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-purple-700 mb-2">
          Student Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          {row.student_name} — {row.programme}
        </p>
      </header>

      <div className="max-w-3xl mx-auto space-y-10">
        
        {/* PROFILE CARD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Profile</h2>

          <div className="space-y-2 text-gray-700">
            <p><strong>Supervisor:</strong> {row.main_supervisor}</p>
            <p><strong>Email:</strong> {row.student_email}</p>
            <p><strong>Status:</strong> {row.raw["Status P"] || "On Track"}</p>
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Summary</h2>

          <div className="space-y-2 text-gray-700">
            <p><strong>Milestones Completed:</strong> {completed} / 4</p>

            <p>
              <strong>Last Submission:</strong>{" "}
              {row.raw["P5 Submitted"] ||
                row.raw["P4 Submitted"] ||
                row.raw["P3 Submitted"] ||
                row.raw["P1 Submitted"] ||
                "—"}
            </p>

            <p><strong>Overall Status:</strong> {row.raw["Status P"] || "—"}</p>
          </div>
        </div>

        {/* MILESTONE LIST */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Milestone Status
          </h2>

          <div className="space-y-2 text-gray-700">
            <p><strong>P1 Submitted:</strong> {row.raw["P1 Submitted"] || "—"}</p>
            <p><strong>P1 Approved:</strong> {row.raw["P1 Approved"] || "—"}</p>

            <p><strong>P3 Submitted:</strong> {row.raw["P3 Submitted"] || "—"}</p>
            <p><strong>P3 Approved:</strong> {row.raw["P3 Approved"] || "—"}</p>

            <p><strong>P4 Submitted:</strong> {row.raw["P4 Submitted"] || "—"}</p>
            <p><strong>P4 Approved:</strong> {row.raw["P4 Approved"] || "—"}</p>

            <p><strong>P5 Submitted:</strong> {row.raw["P5 Submitted"] || "—"}</p>
            <p><strong>P5 Approved:</strong> {row.raw["P5 Approved"] || "—"}</p>
          </div>
        </div>

        {/* REMINDER BUTTON */}
        <div className="text-center">
          <button
            onClick={() => alert("Reminder sent!")}
            className="px-6 py-3 bg-purple-600 text-white rounded-full shadow hover:bg-purple-700"
          >
            Send Reminder
          </button>
        </div>
      </div>
    </div>
  );
}
