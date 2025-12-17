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
 */
router.get("/my", verifyToken, async (req, res) => {
  try {
    const docs = await getMyDocuments(req.user.email);
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load documents" });
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
      const doc = await uploadDocument({
        file: req.file,
        studentEmail: req.user.email,
        section: req.body.section,
        documentType: req.body.document_type,
      });
      res.json(doc);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

export default router;
