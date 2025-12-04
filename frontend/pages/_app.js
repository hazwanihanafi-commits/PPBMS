import "../styles/globals.css";
import Head from "next/head";
import NewHeader from "../components/ui/NewHeader";
import NewFooter from "../components/ui/NewFooter";

export default function App({ Component, pageProps, router }) {

  // Landing page should NOT use header/footer
  const noLayoutPages = ["/"];
  const hideLayout = noLayoutPages.includes(router.route);

  return (
    <>
      <Head>
        <title>PPBMS — Student Progress System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6B21A8" />
      </Head>

      {!hideLayout && <NewHeader />}

      <main className="min-h-[calc(100vh-160px)]">
        <Component {...pageProps} />
      </main>

      {!hideLayout && <NewFooter />}
    </>
  );
}
