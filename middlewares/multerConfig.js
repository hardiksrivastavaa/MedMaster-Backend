// MedMaster-Backend/middleware/multerConfig.js

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure Cloudinary Storage Engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    let folder = 'medmaster_notes'; 
    
    // NOTE: 'raw' is correct for documents (PDF, DOCX) and forces Cloudinary to save as-is.
    let resource_type = 'raw'; 
    
    // 💥 FIX 1: Safely extract the extension in lowercase (without the dot)
    const originalName = file.originalname;
    const extension = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase(); // Convert to lowercase
    
    // FIX 2: Create a sanitized public ID from the filename
    const filenameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')).replace(/[^a-zA-Z0-9]/g, '_');
    
    return {
      folder: folder,
      resource_type: resource_type,
      
      // 💥 FIX 3 (CRITICAL): Set 'format' explicitly to guarantee the file extension.
      // This tells Cloudinary how to save the file type.
      format: extension, 
      
      public_id: `${filenameWithoutExt}-${Math.random().toString(36).substring(2, 7)}`,
      asset_folder: folder, 
    };
  },
});

// 3. Configure Multer Middleware
const uploadCloud = multer({
  storage: storage,
  // Limit file size to 10MB
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    // Allows PDF and common image/document types
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/png' ||
        file.mimetype === 'application/msword' || // .doc
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
        ) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only PDF, DOCX, JPG, PNG allowed.'), false);
    }
  },
});

export { uploadCloud, cloudinary };