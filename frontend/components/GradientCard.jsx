// components/GradientCard.jsx
export default function GradientCard({ children }) {
  return (
    <div className="rounded-lg bg-white shadow-sm p-6 border border-gray-100">
      {children}
    </div>
  );
}
