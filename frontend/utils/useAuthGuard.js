import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export function useAuthGuard(requiredRole) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 🚫 Must run only in browser
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");
    const email = localStorage.getItem("ppbms_email");

    // ❌ No token → redirect
    if (!token) {
      router.replace("/login");
      return;
    }

    // ❌ Role mismatch → redirect
    if (requiredRole && role !== requiredRole) {
      router.replace("/login");
      return;
    }

    // ✅ Auth OK
    setUser({ email, role });
    setReady(true);
  }, [router, requiredRole]);

  return { ready, user };
}
