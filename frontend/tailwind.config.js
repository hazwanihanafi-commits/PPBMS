// tailwind.config.js
module.exports = {
  content: [
    "./frontend/**/*.{js,jsx,ts,tsx}",   // scan EVERYTHING inside frontend
    "./frontend/pages/**/*.{js,jsx,ts,tsx}",
    "./frontend/components/**/*.{js,jsx,ts,tsx}",
    "./frontend/app/**/*.{js,jsx,ts,tsx}", // if Next.js uses app router
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6B21A8",
          light: "#A78BFA",
          muted: "#EDE9FE",
        },
        accent: "#06B6D4",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 6px 18px rgba(99,102,241,0.08)",
        card: "0 10px 30px rgba(15,23,42,0.06)",
      },
    },
  },
  plugins: [],
};
