// backend/app.js
import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";

console.log("DEBUG — Checking routes directory:");
console.log("Routes folder exists:", fs.existsSync(path.resolve("routes")));
console.log("tasks.js exists:", fs.existsSync(path.resolve("routes/tasks.js")));


// Load env vars
dotenv.config();

// Init app
const app = express();

// ----------------------
// CORS
// ----------------------
app.use(
  cors({
    origin: [
      "https://ppbms-frontend.onrender.com", // Production frontend
      "http://localhost:3000",               // Local development
    ],
    credentials: true,
  })
);

// ----------------------
// Middleware
// ----------------------
app.use(express.json());
app.use(cookieParser());

// ----------------------
// Routers
// ----------------------
import apiRouter from "./routes/api.js";
import studentRouter from "./routes/student.js";
import supervisorRouter from "./routes/supervisor.js";
import authRouter from "./routes/auth.js";
import tasksRouter from "./routes/tasks.js";

// ----------------------
// Route registration
// ----------------------

// General API
app.use("/api", apiRouter);

// Student API
app.use("/api/student", studentRouter);

// Supervisor API
app.use("/api/supervisor", supervisorRouter);

// Authentication (login, register, refresh, logout)
app.use("/auth", authRouter);

// File uploads (PDFs, documents, Drive uploads, sheet updates)
app.use("/tasks", tasksRouter);
// Final upload URL is:
// POST https://ppbms.onrender.com/tasks/upload

// Root test
app.get("/", (req, res) => {
  res.send("PPBMS Student Progress API is running");
});

app.get("/test-debug", (req, res) => {
  res.send("Backend updated & routes registered successfully");
});

app.get("/zz-test", (req, res) => {
  res.send("YES — backend code is running");
});


// ----------------------
// 404 handler
// ----------------------
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

console.log("Registered routes:");
app._router.stack.forEach((layer) => {
  if (layer.route) {
    console.log(layer.route.path);
  }
});


export default app;
