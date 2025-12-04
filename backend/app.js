import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/student.js";
import supervisorRoutes from "./routes/supervisor.js";
import tasksRoutes from "./routes/tasks.js";
import apiRoutes from "./routes/api.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "Backend running", time: new Date() });
});

// Auth routes
app.use("/auth", authRoutes);

// Student routes
app.use("/api/student", studentRoutes);

// Supervisor routes
app.use("/api/supervisor", supervisorRoutes);

// Local PDF upload (optional)
app.use("/tasks", tasksRoutes);

// Generic API
app.use("/api", apiRoutes);

// ❗ Fallback 404 must be last
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
