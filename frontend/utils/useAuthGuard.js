// frontend/utils/useAuthGuard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export function useAuthGuard(requiredRole) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");
    const email = localStorage.getItem("ppbms_email");

    if (!token || role !== requiredRole) {
      router.replace("/login");
      return;
    }

    setUser({ email, role });
    setReady(true);
  }, [router.isReady, requiredRole]);

  return { ready, user };
}
