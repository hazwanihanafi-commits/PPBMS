const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://ppbms.onrender.com";


async function request(
  url,
  options = {}
) {

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      15000
    );

  try {

    const response =
      await fetch(
        url,
        {
          ...options,
          signal:
            controller.signal,
        }
      );

    const text =
      await response.text();

    let data = {};

    try {
      data =
        text
          ? JSON.parse(text)
          : {};
    } catch {
      data = {
        raw: text
      };
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

    if (
      error.name ===
      "AbortError"
    ) {

      throw new Error(
        "PPBMS server timed out."
      );

    }

    throw error;

  } finally {

    clearTimeout(timeout);

  }
}


/*
 * Get logged-in PPBMS student
 */
export async function
getStudentProfile(token) {

  return request(
    `${API_BASE}/api/student/me`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

}


/*
 * Get orientation completion status
 */
export async function
getOrientationStatus(token) {

  return request(
    `${API_BASE}/api/orientation/status`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

}


/*
 * Complete orientation
 */
export async function
completeOrientation(
  token,
  payload
) {

  return request(
    `${API_BASE}/api/orientation/complete`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body:
        JSON.stringify(payload),
    }
  );

}
