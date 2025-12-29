import { API_BASE } from "./api";

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("ppbms_token");

  if (!token) {
    throw new Error("NO_TOKEN");
  }

  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}
