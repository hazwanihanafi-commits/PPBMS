// components/GradientCard.jsx
export default function GradientCard({ children }) {
  return (
    <div className="rounded-xl bg-white shadow-md p-6 ring-1 ring-slate-200 overflow-hidden">
      <div className="rounded-lg bg-white p-0">{children}</div>
    </div>
  );
}
