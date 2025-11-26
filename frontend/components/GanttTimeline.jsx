import { parseISO, differenceInDays } from "date-fns";

export default function GanttTimeline({ raw = {} }) {
  // raw defaults to {} so Object.keys will NEVER crash

  if (!raw || Object.keys(raw).length === 0) {
    return (
      <div className="p-4 text-gray-500 italic">
        Loading timeline…
      </div>
    );
  }

  const milestones = [
    { key: "P1 Submitted", label: "P1 Submitted" },
    { key: "P1 Approved", label: "P1 Approved" },
    { key: "P3 Submitted", label: "P3 Submitted" },
    { key: "P3 Approved", label: "P3 Approved" },
    { key: "P4 Submitted", label: "P4 Submitted" },
    { key: "P4 Approved", label: "P4 Approved" },
    { key: "P5 Submitted", label: "P5 Submitted" },
    { key: "P5 Approved", label: "P5 Approved" },
  ];

  // Convert raw values into usable chart data
  const data = milestones.map(m => {
    const date = raw[m.key] ? parseISO(raw[m.key]) : null;

    return {
      ...m,
      date,
      completed: Boolean(raw[m.key]),
    };
  });

  return (
    <div className="p-4 bg-white border rounded-xl shadow">
      <h3 className="text-xl font-semibold mb-4">Gantt Timeline</h3>

      {data.map((m, idx) => (
        <div key={idx} className="mb-4">
          <div className="font-medium">{m.label}</div>

          {m.completed ? (
            <div className="h-3 w-full bg-purple-200 rounded relative">
              <div
                className="h-3 bg-purple-600 rounded"
                style={{ width: "100%" }}
              ></div>
              <span className="text-xs text-gray-600">
                {raw[m.key]}
              </span>
            </div>
          ) : (
            <div className="h-3 w-full bg-gray-200 rounded relative">
              <div
                className="h-3 bg-gray-400 rounded"
                style={{ width: "10%" }}
              ></div>
              <span className="text-xs text-gray-500">Pending</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
