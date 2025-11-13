// MedMaster-Backend/routes/tutorRoutes.js
import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { isTutor } from '../middlewares/roleMiddleware.js';

// Import from TutorController
import { 
    getTutorStats, 
    getAllStudents, 
    updateStudentBatch, 
    whitelistStudent
} from '../controllers/tutorController.js'; 

// Import Batch and Content management functions
import { 
    getAllBatches, 
    createBatch, 
    updateBatch, 
    deleteBatch 
} from '../controllers/batchController.js';
import { 
    createContent, 
    getTutorContent, 
    updateContent, 
    deleteContent 
} from '../controllers/contentController.js';
import { 
    createAnnouncement, 
    getTutorAnnouncements // Use for history if needed
} from '../controllers/announcementController.js';


const router = express.Router();

// Apply common middleware to all tutor routes
router.use(protect, isTutor);

// --- DASHBOARD & STATS ---
router.get('/dashboard/stats', getTutorStats);
router.get('/students', getAllStudents);
router.put('/students/:id/batch', updateStudentBatch); 
router.put('/students/:id/whitelist', whitelistStudent);

// --- BATCH MANAGEMENT ---
router.get('/batches', getAllBatches);
router.post('/batches', createBatch);
router.put('/batches/:id', updateBatch);
router.delete('/batches/:id', deleteBatch);

// --- CONTENT (CLASSES/NOTES) MANAGEMENT ---
// Fetch all content of a certain type (e.g., ?type=recorded_lecture)
router.get('/content', getTutorContent); 
// Create a new content item (Live Class, Lecture, Note)
router.post('/content', createContent); 
router.put('/content/:id', updateContent);
router.delete('/content/:id', deleteContent);

// --- ANNOUNCEMENT MANAGEMENT ---
router.post('/announcements', createAnnouncement);
router.get('/announcements', getTutorAnnouncements); 


export default router;