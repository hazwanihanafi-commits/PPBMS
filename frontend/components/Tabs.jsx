export default function Tabs({ tabs, active, setActive }) {
  return (
    <div className="flex gap-6 border-b border-gray-200 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`pb-2 font-semibold transition ${
            active === tab
              ? "border-b-2 border-purple-600 text-purple-600"
              : "text-gray-500 hover:text-purple-600"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
