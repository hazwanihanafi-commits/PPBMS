const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://ppbms.onrender.com";

export async function login(email, password) {

  const response = await fetch(
    `${API_BASE}/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email,
        password
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Login failed"
    );
  }

  return data;
}


export async function getStudentProfile(token) {

  const response = await fetch(
    `${API_BASE}/api/student/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Unable to retrieve student profile"
    );
  }

  return data;
}


export async function getOrientationStatus(token) {

  const response = await fetch(
    `${API_BASE}/api/orientation/status`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Unable to retrieve orientation status"
    );
  }

  return data;
}


export async function completeOrientation(
  token,
  payload
) {

  const response = await fetch(
    `${API_BASE}/api/orientation/complete`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },

      body: JSON.stringify(payload)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Unable to complete orientation"
    );
  }

  return data;
}
