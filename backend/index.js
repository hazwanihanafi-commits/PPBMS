import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import apiRouter from './routes/api.js';
import { scheduleCronJobs } from './cron/runner.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/auth', authRouter);
app.use('/api', apiRouter);

app.get('/health', (req,res)=> res.json({ok:true, time: new Date().toISOString()}));

const port = process.env.PORT || 4000;
app.listen(port, ()=> {
  console.log('Backend running on', port);
  // start cron jobs in same process (alternatively run separately)
  scheduleCronJobs();
});
