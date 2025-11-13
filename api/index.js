// MedMaster-Backend/server.js

import express from 'express';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import authRoutes from '../routes/authRoutes.js';
import tutorRoutes from '../routes/tutorRoutes.js';
import studentRoutes from '../routes/studentRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import uploadRoutes from '../routes/uploadRoutes.js';
import cors from 'cors';

dotenv.config();
connectDB();

const app = express();

app.use(cors());

// Configuration for JSON/Form parsing limits (CRITICAL for large JSON/payload)
const jsonParser = express.json({ limit: '50mb' });

// --- CORRECTED ROUTE PLACEMENT ---

// Apply JSON parser BEFORE mounting the routers that need JSON bodies.
// This ensures that non-file routes work correctly.
app.use('/api/auth', jsonParser, authRoutes);
app.use('/api/tutor', jsonParser, tutorRoutes);
app.use('/api/user', jsonParser, userRoutes);
app.use('/api/student', jsonParser, studentRoutes);

// File upload route relies ONLY on Multer. We DO NOT apply express.json() here.
// Multer's body-parser runs exclusively on this endpoint.
app.use('/api/upload', uploadRoutes);

// Simple welcome route
app.get('/', (req, res) => {
    res.send('MedMaster-Backend API is running...');
});

const PORT = process.env.PORT || 5000;

if (process.env.ENVIRONMENT == 'dev') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
