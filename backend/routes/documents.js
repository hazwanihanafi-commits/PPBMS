import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { saveLink, getMyDocuments } from "../services/documentsService.js";

const router = express.Router();

/**
 * GET my documents
 */
router.get("/my", verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
    const docs = await getMyDocuments(email);
    return res.json(docs);
  } catch (e) {
    console.error("GET /my error", e);
    return res.json([]);
  }
});

/**
 * SAVE LINK (PASTE MODE)
 */
router.post("/save-link", verifyToken, async (req, res) => {
  try {
    const { document_type, section, file_url } = req.body;

    if (!file_url || !document_type) {
      return res.status(400).json({ error: "Missing data" });
    }

    const row = await saveLink({
      studentEmail: req.user.email,
      documentType: document_type,
      section,
      fileUrl: file_url,
    });

    return res.json(row);
  } catch (e) {
    console.error("POST /save-link error", e);
    return res.status(500).json({ error: "Failed to save link" });
  }
});

export default router;
