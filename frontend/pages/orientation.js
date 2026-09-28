import Head from "next/head";

export default function OrientationPage() {
  return (
    <>
      <Head>
        <title>
          PKTAAB Postgraduate Orientation | USM
        </title>

        <meta
          name="description"
          content="PKTAAB Postgraduate Student Orientation"
        />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
      </Head>

      <iframe
        src="/orientation/index.html"
        title="PKTAAB Postgraduate Orientation"
        style={{
          width: "100%",
          height: "100vh",
          border: "none",
          display: "block",
        }}
      />
    </>
  );
}
