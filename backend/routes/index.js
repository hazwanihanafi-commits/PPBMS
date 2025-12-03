// backend/routes/index.js
import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "Backend running",
    time: new Date().toISOString()
  });
});

export default router;
