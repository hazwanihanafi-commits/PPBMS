// frontend/pages/_app.js
import "../styles/globals.css";
import Head from "next/head";
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
  <title>PPBMS — Student Progress</title>

  {/* Correct 2025 viewport */}
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  {/* Theme colors */}
  <meta name="theme-color" content="#6B21A8" />
  <meta name="color-scheme" content="light dark" />
</Head>


      <Header />

      <main className="min-h-[calc(100vh-160px)] bg-gray-50">
        <Component {...pageProps} />
      </main>

      <Footer />
    </>
  );
}

export default MyApp;
