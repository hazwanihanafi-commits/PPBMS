import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";
import studentRouter from "./student.js";

const router = express.Router();

/* ---------------------------------------------
   PUBLIC: GET STATUS BY EMAIL
----------------------------------------------*/
router.get("/status", async (req, res) => {
  try {
    const email = (req.query.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ error: "Missing email" });

    const rows = await readMasterTracking(process.env.SHEET_ID);

    const row = rows.find(
      (r) =>
        (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!row) return res.status(404).json({ error: "Student not found" });

    res.json({
      email: row["Student's Email"],
      name: row["Student Name"],
      programme: row["Programme"],
      P1: row["P1 Submitted"] || "",
      P3: row["P3 Submitted"] || "",
      P4: row["P4 Submitted"] || "",
      P5: row["P5 Submitted"] || "",
      overall: row["Status P"] || "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------------------------------------
   STUDENT ROUTES (PROTECTED)
----------------------------------------------*/
router.use("/student", studentRouter);

export default router;
