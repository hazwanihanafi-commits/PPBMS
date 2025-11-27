// components/GradientCard.jsx
export default function GradientCard({ children }) {
  return (
    <div className="rounded-lg bg-white shadow-md p-5 border border-transparent">
      {/* subtle internal top gradient stripe */}
      <div className="rounded-md overflow-hidden">
        <div className="p-4 bg-white">{children}</div>
      </div>
    </div>
  );
}
