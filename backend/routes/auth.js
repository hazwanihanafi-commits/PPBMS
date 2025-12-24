import express from "express";
const router = express.Router();

router.post("/request-password", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email required" });

  // TODO later: send email
  // For now just allow direct password setup
  return res.json({ success: true });
});

