// components/ActivityMapping.jsx
const MAP = [
  ["Registration", "P1"],
  ["Literature", "P3"],
  ["Proposal", "P3"],
  ["Ethics", "P3"],
  ["Pilot", "P4"],
  ["Implementation", "P4"],
  ["Mid-Candidature", "P5"],
  ["Seminar", "P5"],
  ["Publication", "P4"],
  ["Dissemination", "P4"],
  ["Thesis", "P5"],
  ["Pre-Submission", "P5"],
  ["Examination", "P5"],
];

export default function ActivityMapping() {
  return (
    <div className="overflow-x-auto rounded-xl shadow-sm bg-white">
      <table className="min-w-full border-collapse">
        
        {/* Header */}
        <thead>
          <tr className="bg-gradient-to-r from-purple-600 to-purple-400 text-white">
            <th className="py-3 px-4 text-left font-semibold">Activity</th>
            <th className="py-3 px-4 text-left font-semibold">Milestone</th>
          </tr>
        </thead>

        {/* Rows */}
        <tbody>
          {MAP.map(([act, code], idx) => (
            <tr
              key={act}
              className={`
                ${idx % 2 === 0 ? "bg-purple-50/40" : "bg-white"}
                hover:bg-purple-100 transition
              `}
            >
              <td className="py-3 px-4 text-slate-800 font-medium">
                {act}
              </td>
              <td className="py-3 px-4 text-slate-700">{code}</td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}
