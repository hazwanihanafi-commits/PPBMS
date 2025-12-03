// backend/app.js
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// -----------------------------
// IMPORT ALL ROUTES
// -----------------------------
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/student.js";
import supervisorRoutes from "./routes/supervisor.js";
import tasksRoutes from "./routes/tasks.js";
import adminRoutes from "./routes/admin.js";
import approvalRoutes from "./routes/approval.js";
import apiRoutes from "./routes/api.js";

// -----------------------------
// MOUNT ROUTES
// -----------------------------
app.use("/auth", authRoutes);
app.use("/student", studentRoutes);
app.use("/supervisor", supervisorRoutes);
app.use("/tasks", tasksRoutes);
app.use("/admin", adminRoutes);
app.use("/approval", approvalRoutes);
app.use("/api", apiRoutes);

// -----------------------------
// HEALTH CHECK
// -----------------------------
app.get("/", (req, res) => {
  res.json({ status: "Backend running", time: new Date().toISOString() });
});

// -----------------------------
// 404 HANDLER — MUST BE LAST
// -----------------------------
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
