// backend/app.js
import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";

import apiRouter from "./routes/api.js";
import studentRouter from "./routes/student.js";
import supervisorRouter from "./routes/supervisor.js";
import authRouter from "./routes/auth.js";

dotenv.config();
const app = express();

// CORS
app.use(cors({
  origin: [
    "https://ppbms-frontend.onrender.com",
    "http://localhost:3000",
  ],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Root
app.get("/", (req, res) => {
  res.send("AMDI Student Progress API is running");
});

// Routes
app.use("/api", apiRouter);
app.use("/api/student", studentRouter);
app.use("/api/supervisor", supervisorRouter);
app.use("/auth", authRouter);

export default app;
