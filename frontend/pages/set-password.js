import { useRouter } from "next/router";
import { useState } from "react";
import { API_BASE } from "../utils/api";

export default function SetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit() {
    const res = await fetch(`${API_BASE}/auth/set-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setMsg("Password set successfully. You may now login.");
    } else {
      setMsg("Invalid or expired link.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full">
        <h1 className="text-xl font-bold mb-4">Create Password</h1>

        <input
          type="password"
          placeholder="New Password"
          className="w-full border p-3 rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={submit}
          className="w-full bg-purple-600 text-white py-3 rounded"
        >
          Save Password
        </button>

        {msg && <p className="mt-4">{msg}</p>}
      </div>
    </div>
  );
}
