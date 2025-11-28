// components/AdminAnalytics.jsx
export default function AdminAnalytics({ analytics }) {
  if (!analytics) return <div className="text-sm text-gray-500">No analytics data.</div>;

  const { byMilestone = {}, byDepartment = {}, onTimeVsOverdue = {} } = analytics;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-gray-500">Students by milestone</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {Object.keys(byMilestone).map(k => (
            <div key={k} className="rounded p-2 bg-gray-50">
              <div className="text-xs text-gray-500">{k}</div>
              <div className="font-semibold">{byMilestone[k]}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm text-gray-500">By department (top 6)</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {Object.keys(byDepartment).slice(0,6).map(k => (
            <div key={k} className="rounded p-2 bg-gray-50">
              <div className="text-xs text-gray-500">{k}</div>
              <div className="font-semibold">{byDepartment[k]}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm text-gray-500">On-time vs Overdue</div>
        <div className="mt-2 flex gap-4">
          <div className="rounded p-3 bg-green-50">
            <div className="text-xs text-gray-500">On-time</div>
            <div className="font-semibold">{onTimeVsOverdue.onTime ?? 0}</div>
          </div>
          <div className="rounded p-3 bg-red-50">
            <div className="text-xs text-gray-500">Overdue</div>
            <div className="font-semibold">{onTimeVsOverdue.overdue ?? 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
