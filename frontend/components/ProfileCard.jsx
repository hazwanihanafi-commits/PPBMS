// frontend/components/ProfileCard.jsx

export default function ProfileCard({ name, programme, supervisor, email, status }) {
  const initials = (name || "NA")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Status color logic
  const STATUS_COLOR = {
    "On Track": "bg-green-100 text-green-700 border-green-200",
    "At Risk": "bg-yellow-100 text-yellow-700 border-yellow-300",
    "Behind": "bg-red-100 text-red-700 border-red-200",
  };

  const statusLabel = status || "On Track";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-purple-100">
      {/* Header row */}
      <div className="flex items-center gap-4">
        {/* Gradient initials box */}
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center 
                        text-white text-3xl font-bold
                        bg-gradient-to-br from-purple-600 to-orange-400 shadow">
          {initials}
        </div>

        <div>
          <div className="text-xl font-extrabold text-slate-900">{name}</div>
          <div className="text-sm text-gray-600">{programme}</div>
        </div>
      </div>

      {/* Profile details */}
      <div className="mt-6 space-y-2 text-sm">
        <div>
          <span className="font-semibold">Supervisor: </span>
          {supervisor}
        </div>
        <div>
          <span className="font-semibold">Email: </span>
          <a href={`mailto:${email}`} className="text-purple-600 underline">
            {email}
          </a>
        </div>
      </div>

      {/* Status badges */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium 
                    ${STATUS_COLOR[statusLabel] || STATUS_COLOR["On Track"]}`}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {statusLabel}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-full text-sm text-purple-700 font-medium">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M9 12h6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Profile
        </div>
      </div>
    </div>
  );
}
