import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";          // student + supervisor
import adminAuthRoutes from "./routes/adminAuth.js"; // admin login ONLY
import studentRoutes from "./routes/student.js";
import supervisorRoutes from "./routes/supervisor.js";
import adminRoutes from "./routes/admin.js";
import tasksRoutes from "./routes/tasks.js";
import apiRoutes from "./routes/api.js";
import documentsRoutes from "./routes/documents.js";

const app = express();

app.use(cors());
app.use(express.json());

/* ============================================
   HEALTH CHECK
===============================================*/
app.get("/", (req, res) => {
  res.json({ status: "Backend running", time: new Date() });
});

/* ============================================
   AUTH ROUTES
===============================================*/

// Student & Supervisor auth (JSON + bcrypt)
app.use("/auth", authRoutes);

// Admin login (SEPARATE)
app.use("/admin-auth", adminAuthRoutes);

/* ============================================
   PROTECTED AREAS
===============================================*/

// Student API
app.use("/api/student", studentRoutes);

// Supervisor API
app.use("/api/supervisor", supervisorRoutes);

// Admin API (requires admin role)
app.use("/api/admin", adminRoutes);

// Documents
app.use("/api/documents", documentsRoutes);

// Tasks (legacy / uploads)
app.use("/tasks", tasksRoutes);

// Generic API
app.use("/api", apiRoutes);

/* ============================================
   404 — Must be last
===============================================*/
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
