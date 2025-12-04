module.exports = {
  content: [
    "./frontend/**/*.{js,jsx,ts,tsx}",
    "./frontend/pages/**/*.{js,jsx,ts,tsx}",
    "./frontend/components/**/*.{js,jsx,ts,tsx}",
    "./frontend/app/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        usm: {
          50: "#FFF8FF",
          100: "#F5EEFF",
          300: "#D8B8FF",
          500: "#A56BFF",
          700: "#6B21A8",
          900: "#3C0F54"
        },
        accent: "#FF8A3D", // orange accent
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem"
      },
      boxShadow: {
        soft: "0 8px 30px rgba(99,102,241,0.08)",
        card: "0 12px 40px rgba(15,23,42,0.06)"
      }
    }
  },
  plugins: [],
};
