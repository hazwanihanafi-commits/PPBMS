// components/GradientCard.jsx
export default function GradientCard({ children }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-transparent overflow-hidden">
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}
