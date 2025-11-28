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
app.use("/auth", authRouter);

app.get("/test-debug", (req, res) =>
  res.send("NEW BACKEND VERSION LOADED")
);

// 404
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

// START SERVER
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log("Backend running on port " + PORT)
);
