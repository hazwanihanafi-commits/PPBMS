export default function Badge({children, tone="neutral"}){
  const toneMap = {
    neutral: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warn: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    primary: "bg-primary-muted text-primary"
  };
  return <span className={`badge ${toneMap[tone] || toneMap.neutral}`}>{children}</span>;
}
