// components/ActivityMapping.jsx
export default function ActivityMapping() {
  const mapping = [
    { activity: "Registration", milestone: "P1" },
    { activity: "Literature Review", milestone: "P3" },
    { activity: "Proposal Writing", milestone: "P3" },
    { activity: "Ethics Application", milestone: "P3" },
    { activity: "Pilot Study", milestone: "P4" },
    { activity: "Implementation / Data Collection", milestone: "P4" },
    { activity: "Publication", milestone: "P4" },
    { activity: "Dissemination", milestone: "P4" },
    { activity: "Mid-Candidature Review", milestone: "P5" },
    { activity: "Seminar", milestone: "P5" },
    { activity: "Thesis Writing", milestone: "P5" },
    { activity: "Pre-Submission", milestone: "P5" },
    { activity: "Examination & Viva", milestone: "P5" },
  ];

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-gradient-to-r from-purple-600 to-pink-500 text-white">
          <th className="p-2 text-left">Activity</th>
          <th className="p-2 text-left">Milestone</th>
        </tr>
      </thead>

      <tbody>
        {mapping.map((row, i) => (
          <tr key={i} className="border-b">
            <td className="p-2">{row.activity}</td>
            <td className="p-2 font-semibold text-purple-700">{row.milestone}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
