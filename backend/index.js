// backend/app.js
import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";

import apiRouter from "./routes/api.js";
import studentRouter from "./routes/student.js";
import supervisorRouter from "./routes/supervisor.js";
import authRouter from "./routes/auth.js";
import taskRouter from "./routes/tasks.js"; // <-- IF YOU ADD TASKS

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "https://ppbms-frontend.onrender.com",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// root
app.get("/", (req, res) => {
  res.send("AMDI Student Progress API is running");
});

// ROUTES
app.use("/api", apiRouter);
app.use("/api/student", studentRouter);
app.use("/api/supervisor", supervisorRouter);
app.use("/api/tasks", taskRouter);     // <-- only if exists
app.use("/auth", authRouter);

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

export default app;
