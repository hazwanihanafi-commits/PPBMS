import express from "express";
import cors from "cors";

import cron from "node-cron";
import { runAutoDelayDetection } from "./jobs/runAutoDelayDetection.js";

import authRoutes from "./routes/auth.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import studentRoutes from "./routes/student.js";
import supervisorRoutes from "./routes/supervisor.js";
import adminRoutes from "./routes/admin.js";
import alertsRoutes from "./routes/alerts.js";
import systemRoutes from "./routes/system.js";
import supervisorRemarkRoutes
  from "./routes/supervisorRemark.js";

const app = express();

/* ================= CORE MIDDLEWARE ================= */

// ✅ CORS MUST BE FIRST
app.use(
  cors({
    origin: [
      "https://ppbms.my",
      "https://www.ppbms.my",
      "https://ppbms-frontend.onrender.com",
      "http://localhost:3000"
    ],
    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS"
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ],
    credentials: true
  })
);

// ✅ Body parser
app.use(express.json());

/* ================= HEALTH CHECK ================= */

app.get("/", (_, res) => {
  res.json({
    status: "PPBMS backend running"
  });
});

/* ================= ROUTES ================= */

// Auth
app.use("/auth", authRoutes);
app.use("/admin-auth", adminAuthRoutes);

// APIs
app.use("/api/student", studentRoutes);
app.use("/api/supervisor", supervisorRoutes);
app.use("/api/admin", adminRoutes);
app.use(
  "/api/supervisor",
  supervisorRemarkRoutes
);

// Alerts / system
app.use("/alerts", alertsRoutes);
app.use("/system", systemRoutes);

/* ================= ⏰ AUTOMATIC DELAY DETECTION ================= */

// Runs daily at 2:00 AM server time
cron.schedule("0 2 * * *", async () => {

  console.log(
    "⏰ Running automatic delay detection job..."
  );

  try {

    await runAutoDelayDetection();

    console.log(
      "✅ Delay detection completed"
    );

  } catch (err) {

    console.error(
      "❌ Delay detection failed:",
      err
    );

  }
});

/* ================= NO CACHE ================= */

app.use((req, res, next) => {

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );

  res.setHeader(
    "Pragma",
    "no-cache"
  );

  res.setHeader(
    "Expires",
    "0"
  );

  next();
});

/* ================= ERROR HANDLER ================= */

app.use((err, req, res, next) => {

  console.error(
    "🔥 Unhandled error:",
    err
  );

  res.status(500).json({
    error: "Internal server error",
    detail: err.message
  });
});

export default app;
