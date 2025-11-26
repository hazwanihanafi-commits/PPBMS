import { useEffect, useState } from "react";
import ProfileCard from "../../components/ProfileCard";
import StatCard from "../../components/StatCard";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function StudentDashboard() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Load token */
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) window.location.href = "/login";
    setToken(t);
  }, []);

  /* Fetch student info */
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

  if (loading) return <div className="p-10 text-center text-lg">Loading…</div>;
  if (error)
    return <div className="p-10 text-center text-red-600 text-lg">{error}</div>;

  if (!row) return null;

  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      
      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-purple-700 tracking-tight">
          Student Progress Overview
        </h1>
        <p className="text-gray-600 mt-1 text-lg">
          {row.student_name} — <span className="font-medium">{row.programme}</span>
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">

        {/* CARD: Academic Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Academic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LEFT CARD */}
            <div className="md:col-span-1">
              <ProfileCard
                name={row.student_name}
                programme={row.programme}
                supervisor={row.main_supervisor}
                email={row.student_email}
              />
            </div>

            {/* RIGHT INFO */}
            <div className="md:col-span-2 space-y-3 text-gray-700">
              <p><strong>Supervisor:</strong> {row.main_supervisor}</p>
              <p><strong>Email:</strong> {row.student_email}</p>
              <p><strong>Status:</strong> On Track</p>
            </div>
          </div>
        </div>

        {/* CARD: Statistics */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Milestone Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Milestones Completed"
              value={`${completed} / 4`}
              icon="success"
            />

            <StatCard
              title="Last Submission"
              value={
                row.raw["P5 Submitted"] ||
                row.raw["P4 Submitted"] ||
                row.raw["P3 Submitted"] ||
                "—"
              }
              icon="progress"
            />

            <StatCard
              title="Overall Status"
              value={row.raw["Status P"] || "—"}
              icon="stats"
            />
          </div>
        </div>

        {/* CARD: Milestone breakdown */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Milestone Status
          </h2>

          {["P1", "P3", "P4", "P5"].map((p) => (
            <div key={p} className="flex justify-between py-2 border-b last:border-b-0 text-gray-700">
              <span>{p} Submitted</span>
              <span>{row.raw[`${p} Submitted`] || "—"}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
