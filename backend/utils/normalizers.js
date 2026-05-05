export function normalizeStatus(raw) {
  const s = String(raw || "").toUpperCase().trim();

  if (["ACTIVE", "IN PROGRESS", "ONGOING"].includes(s)) return "ACTIVE";

  if (["GRADUATED", "COMPLETED", "COMPLETE"].includes(s)) return "GRADUATED";

  if (s.includes("TERMINATED")) return "TERMINATED";

  if (s.includes("SUSPENSION") || s.includes("SUSPENDED")) return "SUSPENDED";

  return "UNKNOWN";
}
