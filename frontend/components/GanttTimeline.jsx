import { parseISO, differenceInDays } from "date-fns";

export default function GanttTimeline({ raw, due }) {
  if (!raw || typeof raw !== "object") {
    return <div className="text-gray-500">No timeline data</div>;
  }

  if (!due || typeof due !== "object") {
    return <div className="text-gray-500">No due dates</div>;
  }

  const milestones = Object.keys(due).map((key) => {
    const submitted = raw[key] || null;
    const dueDate = due[key];

    let status = "pending";
    let daysLate = 0;

    if (submitted) {
      status = "completed";
    } else {
      // Compare today with due date
      const today = new Date();
      const d = parseISO(dueDate);

      if (today > d) {
        status = "overdue";
        daysLate = differenceInDays(today, d);
      }
    }

    return { key, submitted, dueDate, status, daysLate };
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Milestone Timeline</h3>

      <div className="space-y-3">
        {milestones.map((m) => (
          <div key={m.key} className="p-3 border rounded-lg bg-gray-50">
            <div className="font-medium">{m.key}</div>

            <div className="text-sm text-gray-700">
              Due: {m.dueDate}
            </div>

            <div className="text-sm">
              Status:{" "}
              {m.status === "completed"
                ? "✔ Completed"
                : m.status === "overdue"
                ? `❌ Overdue (${m.daysLate} days)`
                : "⏳ Pending"}
            </div>

            {m.submitted && (
              <div className="text-sm text-green-600">
                Submitted: {m.submitted}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
