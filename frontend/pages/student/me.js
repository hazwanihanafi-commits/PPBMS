import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function StudentMe() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  /* LOAD TOKEN */
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) return (window.location.href = "/login");
    setToken(t);
  }, []);

  /* FETCH DATA */
  useEffect(() => {
    if (!token) return;
    (async () => {
      const res = await fetch(`${API}/api/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRow(data.row);
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!row) return null;

  // Progress Calculation
  const submitted = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(Boolean).length;

  const percentage = Math.round((submitted / 4) * 100);

  const STATUS_COLOR = {
    Ahead: "bg-green-600",
    "On Track": "bg-blue-500",
    "At Risk": "bg-yellow-500",
    Behind: "bg-red-600",
  };

  const currentStatus = row.raw["Status P"] || "On Track";

  return (
    <div className="min-h-screen bg-gray-100 pb-20">

      {/* 🌈 GRADIENT HEADER */}
      <header className="w-full bg-gradient-to-r from-purple-700 via-pink-500 to-orange-500 text-white py-10 shadow-lg">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-extrabold tracking-wide">
            PPBMS STUDENT PROGRESS
          </h1>
          <p className="text-lg opacity-90">
            Advanced Medical & Dental Institute • Universiti Sains Malaysia
          </p>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-4xl mx-auto px-6 space-y-6 -mt-10">

        {/* 🌟 PROFILE CARD */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-purple-700 mb-4">
            {row.student_name}
          </h2>

          <p className="text-gray-700 mb-1">{row.programme}</p>

          <p className="text-gray-700">
            <span className="font-bold">Supervisor:</span>{" "}
            {row.main_supervisor}
          </p>

          <p className="text-gray-700">
            <span className="font-bold">Email:</span>{" "}
            {row.student_email}
          </p>

          <div className="mt-3 inline-block px-4 py-2 rounded-full text-white font-semibold text-sm 
            shadow-md 
            ${STATUS_COLOR[currentStatus] || "bg-blue-600"}"
          >
            {currentStatus}
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-purple-700 mb-4">Summary</h2>

          <p className="text-gray-700 text-lg">
            <span className="font-bold">Milestones Completed:</span>{" "}
            {submitted} / 4
          </p>

          <p className="text-gray-700 text-lg">
            <span className="font-bold">Last Submission:</span>{" "}
            {row.raw["P5 Submitted"] ||
              row.raw["P4 Submitted"] ||
              row.raw["P3 Submitted"] ||
              row.raw["P1 Submitted"] ||
              "—"}
          </p>

          <p className="text-gray-700 text-lg">
            <span className="font-bold">Overall Status:</span>{" "}
            {currentStatus}
          </p>
        </div>

        {/* 🌈 PROGRESS RING */}
        <div className="bg-white rounded-3xl p-6 shadow-lg text-center">
          <h2 className="text-xl font-bold text-purple-700 mb-4">
            Progress Chart
          </h2>

          <div className="relative mx-auto w-40 h-40">
            <svg className="w-full h-full">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#eee"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#grad)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${4.4 * percentage} 440`}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
              <defs>
                <linearGradient id="grad">
                  <stop offset="0%" stopColor="#6b21a8" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl text-purple-700">
              {percentage}%
            </div>
          </div>
        </div>

        {/* MILESTONE STATUS */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-purple-700 mb-4">
            Milestone Status
          </h2>

          {["P1", "P3", "P4", "P5"].map((p) => (
            <div key={p} className="mb-4">
              <p className="font-semibold text-gray-800">
                {p} Submitted:{" "}
                <span className="font-normal">
                  {row.raw[`${p} Submitted`] || "—"}
                </span>
              </p>

              <p className="font-semibold text-gray-800">
                {p} Approved:{" "}
                <span className="font-normal">
                  {row.raw[`${p} Approved`] || "—"}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* REMINDER BUTTON */}
        <button className="w-full py-3 rounded-2xl bg-red-500 text-white font-semibold shadow-lg">
          Send Reminder
        </button>
      </main>
    </div>
  );
}
