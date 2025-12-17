import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import {
  getMyDocuments,
  getDocumentsByStudent,
  saveLink,
} from "../services/documentsService.js";
import { updateChecklistCell } from "../services/masterTracking.js";

const router = express.Router();

/* =====================================================
   STUDENT: GET OWN SUBMISSION HISTORY (READ-ONLY)
===================================================== */
router.get("/my", verifyToken, async (req, res) => {
  try {
    const docs = await getMyDocuments(req.user.email);
    res.status(200).json(docs);
  } catch (err) {
    console.error(err);
    res.status(200).json([]);
  }
});

/* =====================================================
   SUPERVISOR: GET STUDENT SUBMISSION HISTORY (READ-ONLY)
===================================================== */
router.get("/student/:email", verifyToken, async (req, res) => {
  try {
    const docs = await getDocumentsByStudent(req.params.email);
    res.status(200).json(docs);
  } catch (err) {
    console.error(err);
    res.status(200).json([]);
  }
});

/* =====================================================
   SAVE LINK (STUDENT / SUPERVISOR)
   ✔ Documents Sheet (history)
   ✔ Master Tracking (checklist)
===================================================== */
router.post("/save-link", verifyToken, async (req, res) => {
  try {
    const {
      section,
      document_type,   // MUST match Master Tracking header (e.g. DPLC)
      file_url,
      student_email    // optional (for supervisor)
    } = req.body;

    if (!file_url || !document_type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Determine target student
    const targetEmail =
      req.user.role === "supervisor" && student_email
        ? student_email
        : req.user.email;

    /* ---------- 1️⃣ SAVE HISTORY ---------- */
    const row = await saveLink({
      studentEmail: targetEmail,
      section,
      documentType: document_type,
      fileUrl: file_url,
      uploadedBy: req.user.role
    });

    /* ---------- 2️⃣ UPDATE CHECKLIST ---------- */
    await updateChecklistCell(
      process.env.MASTER_TRACKING_SHEET_ID,
      targetEmail,
      document_type,  // header key
      file_url
    );

    res.json({
      ok: true,
      document_key: document_type,
      file_url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Save failed" });
  }
});

export default router;
