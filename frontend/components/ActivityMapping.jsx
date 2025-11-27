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
      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th style={{textAlign:'left', padding:'8px 6px', color:'#5e2a84', fontWeight:700}}>Activity</th>
            <th style={{textAlign:'left', padding:'8px 6px', color:'#5e2a84', fontWeight:700}}>Milestone</th>
          </tr>
        </thead>
        <tbody>
          {MAP.map(([act, code]) => (
            <tr key={act} style={{borderTop:'1px solid #f1f5f9'}}>
              <td style={{padding:'10px 6px'}}>{act}</td>
              <td style={{padding:'10px 6px'}}>{code}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
