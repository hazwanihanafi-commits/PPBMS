import "../styles/globals.css";
import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../utils/api";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const publicPages = [
      "/login",
      "/set-password",
      "/admin/login", // ✅ ALLOW ADMIN LOGIN
    ];

    if (publicPages.includes(router.pathname)) return;

    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");

    // No token → redirect properly
    if (!token) {
      router.push(
        router.pathname.startsWith("/admin")
          ? "/admin/login"
          : "/login"
      );
      return;
    }

    // Role-based guard
    if (router.pathname.startsWith("/admin") && role !== "admin") {
      router.push("/admin/login");
      return;
    }

    // Verify token
    fetch(`${API_BASE}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => {
      localStorage.clear();
      router.push("/login");
    });
  }, [router.pathname]);

  return (
    <>
      <Head>
        <title>PPBMS — Student Progress</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Component {...pageProps} />
    </>
  );
}
