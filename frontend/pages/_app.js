// frontend/pages/_app.js
import "../styles/globals.css";
import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  // Layout override: if page defines getLayout, use it
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <>
      <Head>
        <title>PPBMS — Student Progress</title>

        {/* Updated 2025-safe viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* System theme colors */}
        <meta name="theme-color" content="#6B21A8" />
        <meta name="color-scheme" content="light dark" />
      </Head>

      {getLayout(<Component {...pageProps} />)}
    </>
  );
}
