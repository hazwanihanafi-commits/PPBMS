import express from "express";
const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ status: "auth route OK" });
});

export default router;

