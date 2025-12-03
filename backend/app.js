// backend/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/student.js";
import supervisorRoutes from "./routes/supervisor.js";
import tasksRoutes from "./routes/tasks.js";
import adminRoutes from "./routes/admin.js";
import approvalRoutes from "./routes/approval.js";
import apiRoutes from "./routes/api.js";
import syncRoutes from "./routes/sync.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// -----------------------------
// Mount all route files
// -----------------------------
app.use("/auth", authRoutes);
app.use("/student", studentRoutes);
app.use("/supervisor", supervisorRoutes);
app.use("/tasks", tasksRoutes);
app.use("/admin", adminRoutes);
app.use("/approval", approvalRoutes);
app.use("/api", apiRoutes);
app.use("/sync", syncRoutes);

// -----------------------------
// Health check
// -----------------------------
app.get("/", (req, res) => {
  res.json({ status: "Backend running", time: new Date().toISOString() });
});

// -----------------------------
// Catch-all 404
// -----------------------------
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
