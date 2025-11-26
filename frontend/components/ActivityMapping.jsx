// components/ActivityMapping.jsx
const mapping = [
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {mapping.map(([act, code]) => (
        <div key={act} className="flex items-start gap-3">
          <div className="mt-1 text-purple-700 font-semibold">•</div>
          <div>
            <div className="font-medium">{act}</div>
            <div className="text-sm text-gray-600">{code}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
