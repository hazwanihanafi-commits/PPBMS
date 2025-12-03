import express from "express";
import cors from "cors";

// Try load morgan, optional
let morgan = null;
try {
  morgan = (await import("morgan")).default;
} catch (e) {
  console.warn("Morgan not installed — skipping logging middleware.");
}

const app = express();

app.use(cors());
app.use(express.json());

if (morgan) app.use(morgan("dev"));

// Load routes
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/student.js";
import supervisorRoutes from "./routes/supervisor.js";
import tasksRoutes from "./routes/tasks.js";
import adminRoutes from "./routes/admin.js";
import approvalRoutes from "./routes/approval.js";
import apiRoutes from "./routes/api.js";
import syncRoutes from "./routes/sync.js";

app.use("/auth", authRoutes);
app.use("/student", studentRoutes);
app.use("/supervisor", supervisorRoutes);
app.use("/tasks", tasksRoutes);
app.use("/admin", adminRoutes);
app.use("/approval", approvalRoutes);
app.use("/api", apiRoutes);
app.use("/sync", syncRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({ status: "Backend running", time: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
