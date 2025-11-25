import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();

// 🟢 FIX CORS HERE
app.use(cors({
  origin: [
    "https://ppbms-frontend.onrender.com",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.options("*", cors());   // Preflight support

app.use(express.json());
app.use(cookieParser());
