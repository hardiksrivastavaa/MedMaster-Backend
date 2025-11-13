import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Content from '../models/Content.js';
import { getTutorAnnouncements } from './announcementController.js';
// Assuming you kept announcementController separate

// --- HELPER FUNCTIONS (Internal to TutorController for re-use) ---

// Helper to get total student count for the stats card
const getTotalStudentCount = async () => {
    return User.countDocuments({ role: 'student' });
};

// Helper to get active classes (e.g., live classes not yet passed)
const getActiveClassesCount = async () => {
    return Content.countDocuments({
        contentType: 'live_class',
        date: { $gte: new Date() }
    });
};

// Helper to get total notes count
const getTotalNotesCount = async () => {
    return Content.countDocuments({ contentType: 'study_note' });
};

// Helper to get all batches with counts (re-used from batchController logic)
const getBatchesWithCounts = async () => {
    const batches = await Batch.find({});

    const batchesWithCounts = await Promise.all(
        batches.map(async (batch) => {
            const studentCount = await User.countDocuments({ batch: batch._id, role: 'student' });
            return {
                id: batch._id,
                name: batch.name,
                description: batch.description,
                studentCount: studentCount,
            };
        })
    );
    return batchesWithCounts;
};

// --- CONTROLLER EXPORTS ---

/**
 * @desc Get all statistics needed for the Tutor dashboard overview
 * @route GET /api/tutor/dashboard/stats
 * @access Private (Tutor)
 */
export const getTutorStats = async (req, res) => {
    try {
        const [totalStudents, activeClasses, totalNotes, announcements] = await Promise.all([
            getTotalStudentCount(),
            getActiveClassesCount(),
            getTotalNotesCount(),
            // Assuming getTutorAnnouncements returns only count or relevant info for stats
            // For simplicity, we'll assume a basic query for total announcements this month:
            // Adjust this logic if the frontend needs a specific count
            Content.countDocuments({ uploadedBy: req.user.id, uploadDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } })
        ]);

        res.status(200).json({
            totalStudents,
            activeClasses,
            totalNotes,
            announcements, // This represents content/class counts this month
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching tutor stats', error: error.message });
    }
};

/**
 * @desc Get all students (for student management tab)
 * @route GET /api/tutor/students
 * @access Private (Tutor)
 */
export const getAllStudents = async (req, res) => {
    try {
        // Find all users with role 'student' and populate their batch name
        const students = await User.find({ role: 'student' })
            .populate({ path: 'batch', select: 'name' })
            .select('-password');

        const formattedStudents = students.map(student => ({
            id: student._id,
            name: student.name,
            email: student.email,
            batch: student.batch ? student.batch.name : 'Unassigned', // Use the batch name
            batchId: student.batch ? student.batch._id : null,
            progress: student.progress,
            // Include other student fields as needed
        }));

        res.status(200).json(formattedStudents);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching students', error: error.message });
    }
};

/**
 * @desc Assign or update a student's batch
 * @route PUT /api/tutor/students/:id/batch
 * @access Private (Tutor)
 */
export const updateStudentBatch = async (req, res) => {
    try {
        const studentId = req.params.id;
        const { batchId } = req.body; // batchId is the new batch ObjectId or null/empty to unassign

        const student = await User.findById(studentId);

        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: 'Student not found.' });
        }

        // Validate batch if batchId provided
        if (batchId) {
            const batchExists = await Batch.findById(batchId);
            if (!batchExists) {
                return res.status(404).json({ message: 'Invalid batch ID provided.' });
            }
            student.isWhitelisted = true;   // Now it's safe
        } else {
            // No batchId = unassigning student
            student.isWhitelisted = false;
        }
        
        // Update the student's batch field
        student.batch = batchId || null; // Use null to unassign
        await student.save();

        res.status(200).json({ message: 'Student batch updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error updating student batch', error: error.message });
    }
};


/**
 * @desc Approve and whitelist a student for platform access
 * @route PUT /api/tutor/students/:id/whitelist
 * @access Private (Tutor)
 */
export const whitelistStudent = async (req, res) => {
    try {
        const studentId = req.params.id;

        const student = await User.findById(studentId);

        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: 'Student not found or is not a student role.' });
        }

        if (student.isWhitelisted) {
            return res.status(200).json({ message: 'Student is already whitelisted.' });
        }

        student.isWhitelisted = true;
        await student.save();

        res.status(200).json({
            message: 'Student whitelisted successfully. They can now log in.',
            studentId: student._id
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error during student whitelisting', error: error.message });
    }
};


// You will typically merge functions from batchController, contentController, and announcementController into
// tutorRoutes.js or keep them separate and import them here.
// For this guide, we'll treat the functions like createBatch, createContent, etc., as imported utilities.