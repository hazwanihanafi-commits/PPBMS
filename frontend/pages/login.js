import { useState } from "react";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          // 🔥🔥 IMPORTANT — store supervisor email
          localStorage.setItem("ppbms_token", data.token);
          localStorage.setItem("ppbms_user_email", data.email);

          router.push("/supervisor");
        } else {
          setError("Invalid login");
        }
      })
      .catch(() => setError("Login failed"));
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      <input
        className="w-full p-3 border rounded mb-3"
        type="email"
        placeholder="Supervisor Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="w-full p-3 border rounded mb-3"
        type="password"
        placeholder="Password (anything for now)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-red-600">{error}</p>}

      <button
        className="w-full py-3 bg-purple-600 text-white rounded"
        onClick={handleLogin}
      >
        Login
      </button>
    </div>
  );
}
