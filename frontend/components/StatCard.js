// frontend/components/StatCard.js
export default function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 flex flex-col justify-between">
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-3 text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
}
