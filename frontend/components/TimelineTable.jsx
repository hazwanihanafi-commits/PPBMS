// components/TimelineTable.jsx
function daysBetween(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  const diff = Math.floor((today - d) / (1000*60*60*24)); // positive = overdue
  return diff;
}

function remainingLabel(days) {
  if (days == null) return {text: '—', cls: ''};
  if (days <= 0) return {text: `${Math.abs(days)}d`, cls:'upcoming'}; // in future
  if (days <= 14) return {text: `${days}d`, cls:'soon'};
  return {text: `${days}d`, cls:'overdue'};
}

export default function TimelineTable({ rows = [], supervisor = '' }) {
  // rows: [{label, expected, actual}]
  return (
    <div>
      <table className="timeline-table">
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Expected</th>
            <th>Actual</th>
            <th>Status</th>
            <th>Remaining</th>
            <th>Supervisor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const exp = r.expected ? (new Date(r.expected)).toLocaleDateString('en-GB') : '—';
            const actual = r.actual || '—';
            // compute remaining as days until expected (negative -> overdue)
            let remainingDays = null;
            if (r.expected) {
              const expectedDate = new Date(r.expected);
              if (!Number.isNaN(expectedDate.getTime())) {
                const today = new Date();
                const diff = Math.ceil((expectedDate - today) / (1000*60*60*24));
                remainingDays = -diff; // positive = overdue count
                // we report overdue as positive days (for visual parity with earlier examples)
                remainingDays = Math.max(-diff, 0) ? Math.abs(Math.floor((today - expectedDate)/(1000*60*60*24))) : Math.abs(diff)*-1;
              }
            }
            const days = daysBetween(r.expected);
            const label = remainingLabel(days);
            const statusText = r.actual ? 'Submitted' : 'Pending';
            return (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.expected ? (new Date(r.expected)).toLocaleDateString('en-GB') : '—'}</td>
                <td>{actual}</td>
                <td>{statusText}</td>
                <td>
                  {label.text !== '—' ? (
                    <span className={`remaining-pill ${label.cls}`}>{label.text} {label.cls === 'overdue' ? 'overdue':''}</span>
                  ) : '—'}
                </td>
                <td className="muted">{supervisor}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
