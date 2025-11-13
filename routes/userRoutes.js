// MedMaster-Backend/routes/userRoutes.js
import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';

const router = express.Router();

// Both routes are protected and use the user ID from the URL parameter for targeting.
router.get('/:id/profile', protect, getUserProfile);
router.put('/:id/profile', protect, updateUserProfile);

export default router;