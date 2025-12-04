import "../styles/globals.css";
import Head from "next/head";
import NewHeader from "../components/ui/NewHeader";
import NewFooter from "../components/ui/NewFooter";

function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>PPBMS — Student Progress</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <NewHeader />

      <main className="min-h-[calc(100vh-160px)] bg-gradient-to-b from-purple-50 to-white">
        <Component {...pageProps} />
      </main>

      <NewFooter />
    </>
  );
}

export default App;
