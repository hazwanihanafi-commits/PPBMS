// components/ActivityMapping.jsx
export default function ActivityMapping() {
  const items = [
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

  return (
    <div className="space-y-2">
      <ul className="list-disc pl-5 text-sm text-slate-800">
        {items.map(([act, code]) => (
          <li key={act} className="mb-1">
            <span className="font-medium">{act}</span>
            <div className="text-xs text-slate-600 mt-0.5">{code}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
