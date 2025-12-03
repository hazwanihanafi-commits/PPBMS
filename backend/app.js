// backend/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";

import adminRoutes from "./routes/admin.js";
import apiRoutes from "./routes/api.js";
import approvalRoutes from "./routes/approval.js";
import authRoutes from "./routes/auth.js";
import indexRoutes from "./routes/index.js";
import studentRoutes from "./routes/student.js";
import supervisorRoutes from "./routes/supervisor.js";
import tasksRoutes from "./routes/tasks.js";

const app = express();

/* --------------------------------------------
   GLOBAL MIDDLEWARE
---------------------------------------------*/
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

/* --------------------------------------------
   ROUTES
---------------------------------------------*/
app.use("/", indexRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/api", apiRoutes);
app.use("/approval", approvalRoutes);
app.use("/student", studentRoutes);         // cleaned version below
app.use("/supervisor", supervisorRoutes);
app.use("/tasks", tasksRoutes);              // file upload route

/* --------------------------------------------
   HEALTH CHECK
---------------------------------------------*/
app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: Date.now() })
);

/* --------------------------------------------
   ERROR HANDLER
---------------------------------------------*/
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  return res.status(500).json({ error: err.message });
});

export default app;
