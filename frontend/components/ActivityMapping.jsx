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
    <div>
      <ul className="list-disc pl-6 space-y-3 text-slate-800">
        {MAP.map(([act, code]) => (
          <li key={act} className="leading-relaxed">
            <div className="font-medium">{act}</div>
            <div className="text-sm text-gray-600">{code}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
