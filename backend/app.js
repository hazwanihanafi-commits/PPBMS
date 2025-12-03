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

// MOUNT ROUTES (Correct)
app.use("/auth", authRoutes);

// Student routes must be under /api/student
app.use("/api/student", studentRoutes);

// Supervisor routes must be under /api/supervisor
app.use("/api/supervisor", supervisorRoutes);

// PDF upload route
app.use("/tasks", tasksRoutes);

// Generic API (if you use it)
app.use("/api", apiRoutes);

// fallback
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
