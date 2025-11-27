// components/TimelineTable.jsx
import React from 'react';
import RemainingDaysBadge from './RemainingDaysBadge';

export default function TimelineTable({ rows = [] }) {
  return (
    <div className="timeline-table">
      <table className="ppbms-table">
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Expected</th>
            <th>Actual</th>
            <th>Status</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const status = r.actual ? 'Submitted' : (new Date(r.expected + 'T00:00:00') < new Date() ? 'Overdue' : 'Pending');
            return (
              <tr key={r.milestone}>
                <td>{r.milestone}</td>
                <td>{r.expected || '—'}</td>
                <td>{r.actual}</td> 
                <td>{status}</td>
                <td><RemainingDaysBadge due={r.expected} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <style jsx>{`
        .ppbms-table { width:100%; border-collapse:collapse; }
        .ppbms-table th { background:linear-gradient(90deg,#7c3aed,#a78bfa); color:white; padding:10px; text-align:left; border-radius:6px; }
        .ppbms-table td { padding:12px; border-bottom:1px solid #eee; vertical-align:middle; }
      `}</style>
    </div>
  );
}
