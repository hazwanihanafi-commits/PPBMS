// frontend/pages/login.js

import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const api = process.env.NEXT_PUBLIC_API_BASE;

  const handleSuccess = async (res) => {
    const idToken = res.credential;

    const r = await fetch(`${api}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await r.json();
    console.log("Backend verify response:", data);

    if (data.token) {
      localStorage.setItem("ppbms_token", data.token);
      window.location.href = "/";
    } else {
      alert("Login failed: " + (data.error || "Unknown error"));
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>
      <p>Please sign in with your USM Google account.</p>

      <GoogleOAuthProvider
        clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {
            console.log("Login Failed");
            alert("Google Login Failed");
          }}
        />
      </GoogleOAuthProvider>
    </div>
  );
}
