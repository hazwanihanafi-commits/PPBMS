import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const API = process.env.NEXT_PUBLIC_API_BASE;

  const handleSuccess = async (res) => {
    const idToken = res.credential;

    const r = await fetch(`${API}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await r.json();

    if (data.token) {
      localStorage.setItem("ppbms_token", data.token);
      window.location.href = "/timeline";   // redirect ke timeline
    } else {
      alert("Login failed: " + (data.error || "Unknown error"));
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Login</h2>
      <p>Please use your USM email</p>

      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => alert("Google Login Failed")}
        />
      </GoogleOAuthProvider>
    </div>
  );
}
