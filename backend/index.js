import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";

import apiRouter from "./routes/api.js";
import studentRouter from "./routes/student.js";
import authRouter from "./routes/auth.js";   // <-- ADD THIS

dotenv.config();
const app = express();

// CORS
app.use(cors({
  origin: ["https://ppbms-frontend.onrender.com", "http://localhost:3000"],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Root check
app.get("/", (req, res) => {
  res.send("AMDI Student Progress API is running");
});

// Routers
app.use("/api", apiRouter);
app.use("/api/student", studentRouter);
app.use("/auth", authRouter);   // <-- REGISTER AUTH API

// 404
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

// Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
