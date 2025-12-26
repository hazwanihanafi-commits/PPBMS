import { API_BASE } from "./api";

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("ppbms_token");

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (res.status === 401) {
    localStorage.removeItem("ppbms_token");
    localStorage.removeItem("ppbms_role");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  return res;
}
