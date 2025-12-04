export default function Button({children, variant="primary", onClick, className=""}){
  const base = "btn " + className;
  if(variant==="primary") return <button className={`${base} btn-primary`} onClick={onClick}>{children}</button>;
  return <button className={`${base} btn-ghost`} onClick={onClick}>{children}</button>;
}
