import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';

import apiRouter from './routes/api.js';
import authRouter from './routes/auth.js';
import indexRouter from './routes/index.js';

dotenv.config();
const app = express();

app.use(cors({
  origin: [
    "https://ppbms-frontend.onrender.com",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.options("*", cors());

app.use(express.json());
app.use(cookieParser());

// REGISTER ROUTES
app.use('/', indexRouter);
app.use('/api', apiRouter);
app.use('/auth', authRouter);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

export default app;
