import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import adminAuthRoutes from "./routes/adminAuth.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_, res) => res.json({ status: "Backend running" }));

app.use("/auth", authRoutes);
app.use("/admin-auth", adminAuthRoutes);

export default app;
