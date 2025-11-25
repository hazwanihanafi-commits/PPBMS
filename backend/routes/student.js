import express from "express";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

router.get("/:matric", async (req, res) => {
  try {
    const matric = String(req.params.matric).trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const student = rows.find(
      (r) => String(r["Matric"]).trim() === matric
    );

    if (!student) return res.status(404).send("Student not found");

    res.json(student);

  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
