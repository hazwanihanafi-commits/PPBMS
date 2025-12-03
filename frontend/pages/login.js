import { useState } from "react";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.toLowerCase().trim();

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      // If backend cannot be reached
      if (!res.ok) {
        setError("Invalid login. Please check your credentials.");
        return;
      }

      const data = await res.json();

      if (!data.token) {
        setError(data.error || "Invalid login");
        return;
      }

      // Save session
      localStorage.setItem("ppbms_token", data.token);
      localStorage.setItem("ppbms_user_email", cleanEmail);
      localStorage.setItem("ppbms_role", data.role || "student");

      // Redirect based on role
      if (data.role === "supervisor") {
        router.push("/supervisor");
      } else {
        router.push("/student/me");
      }

    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError("Server unavailable. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 mt-20 bg-white shadow rounded-xl">
      <h1 className="text-3xl font-bold mb-6">Login</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        
        <input
          type="email"
          className="w-full p-3 border rounded"
          placeholder="Email (e.g. hazwanihanafi@usm.my)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          className="w-full p-3 border rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full p-3 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}
