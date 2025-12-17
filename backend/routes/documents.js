import express from "express";
import multer from "multer";
import verifyToken from "../middleware/verifyToken.js";
import {
  getMyDocuments,
  uploadDocument,
} from "../services/documentsService.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * GET my submitted documents
 * IMPORTANT:
 * - Must ALWAYS return an array
 * - Never return { error } for this endpoint
 */
router.get("/my", verifyToken, async (req, res) => {
  try {
    const email = req.user?.email;

    if (!email) {
      // Safety: no email → return empty list
      return res.status(200).json([]);
    }

    const docs = await getMyDocuments(email);

    // Safety: ensure array
    if (!Array.isArray(docs)) {
      return res.status(200).json([]);
    }

    res.status(200).json(docs);
  } catch (err) {
    console.error("GET /api/documents/my failed:", err);

    // ⬇️ CRITICAL DESIGN CHOICE
    // Frontend must never crash due to documents
    res.status(200).json([]);
  }
});

/**
 * Upload document
 */
router.post(
  "/upload",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const doc = await uploadDocument({
        file: req.file,
        studentEmail: req.user.email,
        section: req.body.section,
        documentType: req.body.document_type,
      });

      res.status(200).json(doc);
    } catch (err) {
      console.error("POST /api/documents/upload failed:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

export default router;
