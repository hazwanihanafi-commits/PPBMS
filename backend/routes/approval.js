// backend/routes/approval.js
import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Approval API OK" });
});

export default router;
