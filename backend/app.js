import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import studentRoutes from "./routes/student.js";
import supervisorRoutes from "./routes/supervisor.js";
import adminRoutes from "./routes/admin.js";
import alertsRoutes from "./routes/alerts.js";
import systemRoutes from "./routes/system.js";

import { verifySMTP } from "./services/mailer.js";

const app = express();

/* ================= CORE MIDDLEWARE ================= */

// ✅ CORS MUST BE FIRST
app.use(
  cors({
    origin: ["https://ppbms-frontend.onrender.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

// ✅ Body parser
app.use(express.json());

/* ================= HEALTH CHECK ================= */

app.get("/", (_, res) => {
  res.json({ status: "PPBMS backend running" });
});

/* ================= ROUTES ================= */

// Auth
app.use("/auth", authRoutes);
app.use("/admin-auth", adminAuthRoutes);

// APIs
app.use("/api/student", studentRoutes);
app.use("/api/supervisor", supervisorRoutes);
app.use("/api/admin", adminRoutes);

// Alerts / system
app.use("/alerts", alertsRoutes);
app.use("/system", systemRoutes);

/* ================= NO CACHE ================= */

app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

/* ================= STARTUP CHECKS ================= */

// 🔑 Verify SMTP safely (DO NOT crash server)
verifySMTP().catch(err =>
  console.error("⚠️ SMTP verification failed:", err.message)
);

export default app;
