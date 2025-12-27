// frontend/utils/api.js

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://ppbms.onrender.com";

/* ===============================
   INTERNAL JSON GUARD
=============================== */
async function parseJSON(res) {
  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    // Try to extract JSON error if possible
    if (contentType.includes("application/json")) {
      const err = await res.json();
      throw new Error(err.error || "API Error");
    }
    throw new Error(`HTTP ${res.status}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error("Non-JSON response from API");
  }

  return res.json();
}

/* ===============================
   GET
=============================== */
export async function apiGet(path) {
  const token = localStorage.getItem("ppbms_token") || "";

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return parseJSON(res);
}

/* ===============================
   POST (JSON)
=============================== */
export async function apiPost(path, body) {
  const token = localStorage.getItem("ppbms_token") || "";

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  return parseJSON(res);
}

/* ===============================
   UPLOAD (FORMDATA)
=============================== */
export async function apiUpload(path, formData) {
  const token = localStorage.getItem("ppbms_token") || "";

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}` // DO NOT set Content-Type
    },
    body: formData
  });

  return parseJSON(res);
}
