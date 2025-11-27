// components/ActivityMapping.jsx
export default function ActivityMapping() {
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

  return (
    <div className="text-sm text-gray-700">
      <ul className="list-disc pl-5 space-y-1">
        {mapping.map(([act, code]) => (
          <li key={act}>
            <div className="font-medium">{act}</div>
            <div className="text-xs text-gray-500">{code}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
