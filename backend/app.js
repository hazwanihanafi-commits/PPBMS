import express from "express";
import cors from "cors";


import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/student.js";
import supervisorRoutes from "./routes/supervisor.js";
import tasksRoutes from "./routes/tasks.js";
import apiRoutes from "./routes/api.js";
import adminRoutes from "./routes/admin.js";   // ✅ ADD THIS
import documentsRoutes from "./routes/documents.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/documents", documentsRoutes);
app.use("/api/supervisor", supervisorRoutes); // ✅ ADD THIS

app.get("/", (req, res) => {
  res.json({ status: "Backend running", time: new Date() });
});

/* ============================================
   ROUTES
===============================================*/

// Auth (student + supervisor + admin login)
app.use("/auth", authRoutes);

// Student area
app.use("/api/student", studentRoutes);

// Supervisor area
app.use("/api/supervisor", supervisorRoutes);

// Admin API (⭐ NEW ⭐)
app.use("/api/admin", adminRoutes);   // 👈 VERY IMPORTANT

// File upload (old)
app.use("/tasks", tasksRoutes);

// Generic API (if needed)
app.use("/api", apiRoutes);

/* ============================================
   404 — Must be last
===============================================*/
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
