import { useEffect } from "react";

export default function OrientationPage() {
  useEffect(() => {
    window.location.replace("/orientation/index.html");
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#53257f",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "32px",
            fontWeight: 800,
            marginBottom: "12px",
          }}
        >
          PKTAAB
        </div>

        <div style={{ fontSize: "14px", opacity: 0.8 }}>
          Loading Postgraduate Orientation...
        </div>
      </div>
    </div>
  );
}
