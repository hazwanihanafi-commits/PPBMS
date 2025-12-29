import React, { memo } from "react";

const FinalPLOTable = memo(function FinalPLOTable({ data = [] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-muted">No data available</p>;
  }

  // 🔢 Calculate totals
  const totals = data.reduce(
    (acc, row = {}) => {
      acc.active += Number(row.activeCount || 0);
      acc.ontime += Number(row.ontimeCount || 0);
      acc.late += Number(row.lateCount || 0);
      acc.graduated += Number(row.graduatedCount || 0);
      return acc;
    },
    { active: 0, ontime: 0, late: 0, graduated: 0 }
  );

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-striped align-middle">
        <thead className="table-light">
          <tr>
            <th>Programme</th>
            <th>Active</th>
            <th>On Time</th>
            <th>Late</th>
            <th>Graduated</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row = {}, index) => {
            const {
              programme = "-",
              activeCount = 0,
              ontimeCount = 0,
              lateCount = 0,
              graduatedCount = 0
            } = row;

            return (
              <tr key={`${programme}-${index}`}>
                <td>{programme}</td>
                <td>{activeCount}</td>
                <td>{ontimeCount}</td>
                <td>{lateCount}</td>
                <td>{graduatedCount}</td>
              </tr>
            );
          })}

          {/* ✅ TOTAL ROW */}
          <tr className="table-secondary fw-bold">
            <td>Total</td>
            <td>{totals.active}</td>
            <td>{totals.ontime}</td>
            <td>{totals.late}</td>
            <td>{totals.graduated}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
});

export default FinalPLOTable;
