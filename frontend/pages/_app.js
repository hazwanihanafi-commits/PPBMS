// frontend/pages/_app.js
import "../styles/globals.css";
import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>PPBMS — Student Progress & Milestones</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Only your page, no header/footer */}
      <div className="min-h-screen bg-gradient-to-b from-[#f4efff] to-white">
        <Component {...pageProps} />
      </div>
    </>
  );
}
