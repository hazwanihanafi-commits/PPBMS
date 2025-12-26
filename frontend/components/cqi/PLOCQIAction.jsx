export default function PLOCQIAction({ actions }) {
  return (
    <div className="mt-3 bg-purple-50 p-3 rounded-lg text-xs">
      <div className="font-semibold mb-1">
        Programme-level CQI Action
      </div>
      <ul className="list-disc pl-5 space-y-1">
        {actions.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
    </div>
  );
}
