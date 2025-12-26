import "../styles/globals.css";
import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../utils/api";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Pages that do NOT require login
    const publicPages = ["/", "/set-password"];

    if (publicPages.includes(router.pathname)) return;

    const token = localStorage.getItem("ppbms_token");

    // No token → force login
    if (!token) {
      router.push("/login");
      return;
    }

    // Verify token once on load
    fetch(`${API_BASE}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
      })
      .catch(() => {
        localStorage.clear();
        router.push("/login");
      });
  }, [router.pathname]);

  return (
    <>
      <Head>
        <title>PPBMS — Student Progress</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6B21A8" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <Component {...pageProps} />
      </div>
    </>
  );
}
