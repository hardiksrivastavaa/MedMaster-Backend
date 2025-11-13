// MedMaster-Backend/routes/uploadRoutes.js

import express from "express";
// Note: Assuming your directory is named 'middlewares', not 'middleware'
import { uploadCloud } from "../middlewares/multerConfig.js";
import protect from "../middlewares/authMiddleware.js";
import { isTutor } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// The main upload endpoint for notes/documents
// This route is NOT processed by express.json(), only by Multer.
router.post(
  "/notes",
  protect,
  isTutor,
  uploadCloud.single("noteFile"), // 3. Process the file (Multer)
  (req, res) => {
    // Multer will place the Cloudinary result on req.file
    if (!req.file) {
      // This happens if Multer limits (like file size) or fileFilter failed
      return res
        .status(400)
        .json({ message: "File upload failed or no file was selected." });
    }

    // Cloudinary upload successful, return the URL and metadata to the client
    res.status(200).json({
      downloadUrl: req.file.path, // Cloudinary's secure URL
      fileName: req.file.originalname,
      fileSize: req.file.size, // Size in bytes
    });
  }
);

export default router;
