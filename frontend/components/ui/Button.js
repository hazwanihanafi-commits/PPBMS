export default function Button({children, onClick, className="", variant="primary"}) {
  const base = "btn " + className;
  if (variant === "primary") return <button className={`${base} btn-primary`} onClick={onClick}>{children}</button>;
  return <button className={base} onClick={onClick}>{children}</button>;
}
