const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://ppbms.onrender.com";

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 10000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const text = await response.text();

    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        `Server error ${response.status}`
      );
    }

    return data;

  } catch (error) {

    if (error.name === "AbortError") {
      throw new Error(
        "The PPBMS server did not respond within 10 seconds."
      );
    }

    throw error;

  } finally {
    clearTimeout(timeout);
  }
}


export async function getStudentProfile(token) {

  return fetchWithTimeout(
    `${API_BASE}/api/student/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

}


export async function getOrientationStatus(token) {

  return fetchWithTimeout(
    `${API_BASE}/api/orientation/status`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

}


export async function completeOrientation(
  token,
  payload
) {

  return fetchWithTimeout(
    `${API_BASE}/api/orientation/complete`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(payload),
    }
  );

}
