// frontend/utils/api.js
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export async function apiGet(path) {
  const token = localStorage.getItem("ppbms_token") || "";
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function apiPost(path, body) {
  const token = localStorage.getItem("ppbms_token") || "";
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  return res.json();
}
