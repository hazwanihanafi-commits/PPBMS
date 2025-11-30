// frontend/components/ProgressCard.jsx
export default function ProgressCard({ title, value }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow text-center">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}
