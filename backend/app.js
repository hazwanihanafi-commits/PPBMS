// backend/app.js
import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS
app.use(
  cors({
    origin: [
      "https://ppbms-frontend.onrender.com",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// Body parser & cookies
app.use(express.json());
app.use(cookieParser());

// ----------------------
// ROUTERS
// ----------------------
import apiRouter from "./routes/api.js";
import studentRouter from "./routes/student.js";
import supervisorRouter from "./routes/supervisor.js";
import authRouter from "./routes/auth.js";
import taskRouter from "./routes/tasks.js";   // ✅ FIXED

// ----------------------
// ROUTE REGISTRATION
// ----------------------
app.use("/api", apiRouter);
app.use("/api/student", studentRouter);
app.use("/api/supervisor", supervisorRouter);
app.use("/auth", authRouter);
app.use("/api/tasks", taskRouter);   // ✅ FIXED & VALID

// Root test
app.get("/", (req, res) => {
  res.send("AMDI Student Progress API is running");
});

app.get("/test-debug", (req, res) =>
  res.send("NEW BACKEND VERSION LOADED")
);

// 404 Handler
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

export default app;
