import "../styles/globals.css";
import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const publicPages = [
      "/",
      "/login",
      "/set-password",
      "/admin/login",
    ];

    if (publicPages.includes(router.pathname)) return;

    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");

    // ❌ No token → redirect
    if (!token) {
      router.replace(
        router.pathname.startsWith("/admin")
          ? "/admin/login"
          : "/login"
      );
      return;
    }

    // ❌ Admin page but not admin
    if (router.pathname.startsWith("/admin") && role !== "admin") {
      router.replace("/admin/login");
      return;
    }

    // ✅ DO NOTHING ELSE
    // ❌ NO /auth/verify here
  }, [router.pathname]);

  return (
    <>
      <Head>
        <title>PPBMS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
