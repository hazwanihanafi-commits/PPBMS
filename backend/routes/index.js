// routes/index.js
import express from "express";
const router = express.Router();

// Landing page
router.get("/", (req, res) => {
  res.render("index"); 
});

export default router;
