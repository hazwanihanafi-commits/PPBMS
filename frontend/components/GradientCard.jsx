// components/GradientCard.jsx
export default function GradientCard({ children, className = "" }) {
  return (
    <div className={`gradient-card ${className}`}>
      {children}
    </div>
  );
}
