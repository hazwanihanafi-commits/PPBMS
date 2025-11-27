// routes/student.js
import express from "express";
import auth from "../middleware/auth.js";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  try {
    const matric = req.user.matric;

    const rows = await readMasterTracking(process.env.SHEET_ID);
    
    const student = rows.find(
      r => String(r["Matric"]).trim() === String(matric).trim()
    );

    if (!student) {
      return res.status(404).json({ error: "Student not found in sheet" });
    }

    return res.json({ row: student });

  } catch (err) {
    console.error("ME ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Export router
export default router;
