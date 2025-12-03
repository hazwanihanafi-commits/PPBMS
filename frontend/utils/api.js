const API = process.env.NEXT_PUBLIC_API_BASE;

export async function apiGet(path) {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function apiPost(path, body) {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

export const API_BASE = API;
