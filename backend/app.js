import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import studentRoutes from "./routes/student.js";
import supervisorRoutes from "./routes/supervisor.js";
import adminRoutes from "./routes/admin.js";
import alertsRoutes from "./routes/alerts.js";


const app = express();

app.use(cors());
app.use(express.json());
app.use("/alerts", alertsRoutes);

app.get("/", (_, res) => {
  res.json({ status: "PPBMS backend running" });
});

/* ================= ROUTES ================= */

// Auth
app.use("/auth", authRoutes);               // student + supervisor login
app.use("/admin-auth", adminAuthRoutes);    // admin login

// APIs
app.use("/api/student", studentRoutes);     // ✅ REQUIRED
app.use("/api/supervisor", supervisorRoutes);
app.use("/api/admin", adminRoutes);

/* ================= 404 ================= */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
