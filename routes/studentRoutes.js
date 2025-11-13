// MedMaster-Backend/routes/studentRoutes.js
import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { isStudent } from '../middlewares/roleMiddleware.js';
import { 
  getDashboardContent, 
  logContentView, 
  logNoteDownload 
} from '../controllers/studentController.js';

const router = express.Router();

// Apply common middleware: All routes in this file require authentication and student role
router.use(protect, isStudent);

// @route   GET /api/student/dashboard/content
// @desc    Get all data needed for the student dashboard tabs
// @access  Private (Student)
router.get('/dashboard/content', getDashboardContent);

// @route   POST /api/student/content/:id/view
// @desc    Log view count for a recorded lecture
// @access  Private (Student)
router.post('/content/:id/view', logContentView);

// @route   POST /api/student/content/:id/download
// @desc    Log download count for a study note
// @access  Private (Student)
router.post('/content/:id/download', logNoteDownload);


export default router;