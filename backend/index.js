import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";

import apiRouter from "./routes/api.js";
import studentRouter from "./routes/student.js";
app.use("/student", studentRouter);

dotenv.config();

const app = express();

// ---------- MIDDLEWARE ----------
app.use(cors({
  origin: [
    "https://ppbms-frontend.onrender.com",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// ---------- ROUTES ----------
app.get("/", (req, res) => {
  res.send("AMDI Student Progress API is running");
});

app.use("/api", apiRouter);
app.use("/student", studentRouter);

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
