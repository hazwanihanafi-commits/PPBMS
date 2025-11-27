// components/MilestoneDefinitions.jsx
export default function MilestoneDefinitions(){
  const data = {
    P1: 'Registration / initial setup. Includes start date and intent.',
    P3: 'Proposal / Ethics / Literature; includes initial methods & timeline.',
    P4: 'Pilot / Implementation / Data collection.',
    P5: 'Mid/Final stage: thesis writing / dissemination / examination.'
  };
  return (
    <div className="ppbms-card">
      <h3 className="section-title">Milestone definitions</h3>
      <ul>
        {Object.entries(data).map(([k,desc]) => (
          <li key={k}><strong>{k}</strong>: {desc}</li>
        ))}
      </ul>
    </div>
  );
}
