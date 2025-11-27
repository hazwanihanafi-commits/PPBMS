// routes/index.js
import express from "express";
import studentRouter from "./student.js";

const router = express.Router();

// Public route
router.get("/status", async (req, res) => {
  res.json({ message: "OK" });
});

// Protected routes
router.use("/student", studentRouter);

export default router;
