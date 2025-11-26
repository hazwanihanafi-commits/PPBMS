// frontend/components/StatCard.jsx
export default function StatCard({ title, value, color = "gray" }) {
  const colorMap = {
    green: "bg-green-50 border-green-100 text-green-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    gray: "bg-gray-50 border-gray-100 text-gray-800",
  };
  return (
    <div className={`p-4 rounded-2xl border ${colorMap[color] || colorMap.gray} shadow-sm`}>
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}
