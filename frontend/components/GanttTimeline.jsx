// components/GanttTimeline.jsx

export default function GanttTimeline({ raw = {}, due = {} }) {

  const tasks = Object.keys(due).map(key => {
    const submitted = raw[key];

    // FIX — prevent invalid dates
    const dueDate = new Date(due[key]);
    const submittedDate = submitted ? new Date(submitted) : null;

    // If invalid, skip
    const safeDue = isNaN(dueDate) ? null : dueDate;
    const safeSubmitted = submittedDate && !isNaN(submittedDate) ? submittedDate : null;

    return {
      label: key,
      due: safeDue,
      submitted: safeSubmitted,
    };
  });

  return (
    <div className="p-4 bg-white shadow rounded-md">
      <p className="text-gray-700 text-sm">Gantt chart placeholder (data loaded safely)</p>

      <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
        {JSON.stringify(tasks, null, 2)}
      </pre>
    </div>
  );
}
